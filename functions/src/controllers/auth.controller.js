const { db } = require("../config/firebase");
const admin = require("firebase-admin");
const config = require("../config/app.config");
const validateHeaders = require('../utils/validateHeaders');
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendSuccess = (res, data, message = "", code = 200) => {
  return res.status(code).json({
    isSuccess: true,
    error: "",
    data: { message, ...data },
    code,
  });
};

const sendError = (res, error, code = 500) => {
  const errorMsg = typeof error === "string" ? error : error.message;
  return res.status(code).json({
    isSuccess: false,
    error: errorMsg,
    data: {},
    code,
  });
};

// Register User
exports.register = async (req, res) => {
  const { email, fullName, dob, gender, password } = req.body;

  try {
    console.log("📥 Register request:", req.body);
    const userRecord = await admin.auth().createUser({ email, password });
    const otp = generateOtp();

    php
    Copy
    Edit
    await db.collection("profiles").doc(userRecord.uid).set({
      email,
      fullName,
      dob,
      gender,
      otp,
      verified: false,
      createdAt: Date.now(),
    });

    return sendSuccess(res, {
      otp: config.showOtpInResponse ? otp : undefined,
      uid: userRecord.uid,
    }, "User created", 201);
  } catch (error) {
    return sendError(res, error, 500);
  }
};

// Login User
exports.login = async (req, res) => {
  if (!validateHeaders(req, res)) return;

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      isSuccess: false,
      error: "Missing email or password",
      data: {},
      code: 400,
    });
  }

  try {

    const fetch = require('node-fetch');

    const apiKey = "AIzaSyDwrdBtOWthkip0WeG5DAjOgYl4ApRBd38"//process.env.FIREBASE_API_KEY; // your Firebase web API key
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(401).json({
        isSuccess: false,
        error: data.error.message || "Invalid email or password",
        data: {},
        code: 401,
      });
    }

    // data.idToken contains Firebase ID token

    const user = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection("profiles").doc(user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        isSuccess: false,
        error: "User profile not found",
        data: {},
        code: 404,
      });
    }

    const profile = userDoc.data();

    if (!profile.verified) {
      const otp = generateOtp();
      await db.collection("profiles").doc(user.uid).update({ otp });

      return res.status(200).json({
        isSuccess: true,
        error: "",
        data: { otp: config.showOtpInResponse ? otp : undefined },
        code: 200,
      });
    }

    // Optionally create a custom token if needed:
    const customToken = await admin.auth().createCustomToken(user.uid);

    return res.status(200).json({
      isSuccess: true,
      error: "",
      data: { idToken: data.idToken, refreshToken: data.refreshToken, customToken },
      code: 200,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      isSuccess: false,
      error: "Internal server error",
      data: {},
      code: 500,
    });
  }
};



// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    console.log("📥 Verify OTP request:", req.body);
    const user = await admin.auth().getUserByEmail(email);
    const docRef = db.collection("profiles").doc(user.uid);
    const snapshot = await docRef.get();

    if (!snapshot.exists) return sendError(res, "User not found", 404);

    const data = snapshot.data();
    if (data.otp !== otp) return sendError(res, "Invalid OTP", 400);

    await docRef.update({ verified: true, otp: null });
    const token = await admin.auth().createCustomToken(user.uid);

    return sendSuccess(res, { token }, "OTP Verified", 200);
  } catch (error) {
    return sendError(res, error, 500);
  }
};