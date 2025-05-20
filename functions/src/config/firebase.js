const admin = require("firebase-admin");
const serviceAccount = require("../../crudfirebase-8ce90-firebase-adminsdk-td0e1-0a404fb0df.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // optionally: databaseURL: "https://your-project.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };
