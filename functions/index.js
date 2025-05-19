const functions = require("firebase-functions");
const app = require("../functions/src/app");

exports.api = functions.https.onRequest(app);
