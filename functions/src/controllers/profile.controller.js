const { db } = require("../config/firebase");
const admin = require("firebase-admin");

// Required headers
const REQUIRED_HEADERS = ["appversion", "appbuildno", "platform"];

// Middleware-style header validation with consistent response format
function validateHeaders(req, res) {
    const missing = REQUIRED_HEADERS.filter(h => !req.headers[h]);
    if (missing.length) {
        return res.status(400).json({
            isSuccess: false,
            error: `Missing headers: ${missing.join(", ")}`,
            data: {},
            code: 400
        });
    }
    return true;
}

// Auth token verification with consistent response format
async function verifyToken(req, res, isRequired = true) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;

    if (!token) {
        if (isRequired) {
            res.status(401).json({
                isSuccess: false,
                error: "Unauthorized: Missing Bearer token",
                data: {},
                code: 401
            });
            return null;
        } else {
            // Token not required and not present, just return null or undefined
            return null;
        }
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded.uid;
    } catch (err) {
        if (isRequired) {
            res.status(401).json({
                isSuccess: false,
                error: "Invalid or expired token",
                data: {},
                code: 401
            });
        }
        return null;
    }
}


// Create Profile
exports.createProfile = async (req, res) => {
    if (!validateHeaders(req, res)) return;

    let uid = await verifyToken(req, res, false);

    try {
        const data = req.body;

        if (!uid) {
            const { email, password } = data;
            if (!email || !password) {
                return res.status(400).json({
                    isSuccess: false,
                    error: "Missing email or password for user creation",
                    data: {},
                    code: 400
                });
            }

            const userRecord = await admin.auth().createUser({ email, password });
            uid = userRecord.uid;
        }

        await db.collection("profiles").doc(uid).set(data);
        return res.status(201).json({
            isSuccess: true,
            error: "",
            data: { message: "Profile created", uid },
            code: 201
        });

    } catch (error) {
        return res.status(500).json({
            isSuccess: false,
            error: error.message,
            data: {},
            code: 500
        });
    }
};



// Get Profile
exports.getProfile = async (req, res) => {
    if (!validateHeaders(req, res)) return;
    const uid = await verifyToken(req, res);
    if (!uid) return;

    try {
        const doc = await db.collection("profiles").doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({
                isSuccess: false,
                error: "Profile not found",
                data: {},
                code: 404
            });
        }
        res.json({
            isSuccess: true,
            error: "",
            data: { id: uid, ...doc.data() },
            code: 200
        });
    } catch (error) {
        res.status(500).json({
            isSuccess: false,
            error: error.message,
            data: {},
            code: 500
        });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    if (!validateHeaders(req, res)) return;
    const uid = await verifyToken(req, res);
    if (!uid) return;

    try {
        await db.collection("profiles").doc(uid).update(req.body);
        res.json({
            isSuccess: true,
            error: "",
            data: { message: "Profile updated" },
            code: 200
        });
    } catch (error) {
        res.status(500).json({
            isSuccess: false,
            error: error.message,
            data: {},
            code: 500
        });
    }
};

// Delete Profile
exports.deleteProfile = async (req, res) => {
    if (!validateHeaders(req, res)) return;
    const uid = await verifyToken(req, res);
    if (!uid) return;

    try {
        await db.collection("profiles").doc(uid).delete();
        res.json({
            isSuccess: true,
            error: "",
            data: { message: "Profile deleted" },
            code: 200
        });
    } catch (error) {
        res.status(500).json({
            isSuccess: false,
            error: error.message,
            data: {},
            code: 500
        });
    }
};
