// utils/validateHeaders.js (example)
module.exports = function validateHeaders(req, res) {
  const appversion = req.headers['appversion'];
  const appbuildno = req.headers['appbuildno'];
  const platform = req.headers['platform'];

  if (!appversion || !appbuildno || !platform) {
    res.status(400).json({
      isSuccess: false,
      error: "Missing required headers: appversion, appbuildno, platform",
      data: {},
      code: 400,
    });
    return false;
  }
  return true;
};
