const express = require("express");
const cors = require("cors");
const profileRoutes = require("./routes/profile.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use("/profile", profileRoutes);
app.use("/auth", authRoutes);

// 404 handler - catch all unmatched routes
app.use((req, res, next) => {
    res.status(404).json({
        isSuccess: false,
        error: "Not Found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});

// Optional: error handler middleware for unexpected errors
app.use((err, req, res, next) => {
   console.error("❌ Unexpected error:", err);
    res.status(500).json({
        isSuccess: false,
        error: "Internal Server Error",
        message: err.message,
    });
});

module.exports = app;
