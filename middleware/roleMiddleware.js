function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện chức năng này',
    });
  }

  next();
}

module.exports = {
  adminOnly,
};
