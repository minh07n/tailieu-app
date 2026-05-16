// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tailieu_secret_key_2025';

function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, JWT_SECRET };
