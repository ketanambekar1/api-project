module.exports = (req, res, next) => {
  const requiredHeaders = ["appversion", "appbuildno", "platform"];
  const missing = requiredHeaders.filter(h => !req.headers[h]);

  if (missing.length) {
    return res.status(400).json({
      error: `Missing headers: ${missing.join(", ")}`
    });
  }
  next();
};
