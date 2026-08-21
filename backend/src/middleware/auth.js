const { verifyToken } = require('../utils/jwt');

// Middleware wajib login: cek Bearer token di header Authorization.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

// Middleware role-based access (contoh: hanya admin boleh hapus data)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak punya akses untuk aksi ini.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
