const express = require("express");
const router = express.Router();
const {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile
} = require("../controllers/profile.controller");

router.post("/registerUser", createProfile);
router.get("/:id", getProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

module.exports = router;
