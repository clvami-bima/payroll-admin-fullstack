// Error handler terpusat. Tidak pernah membocorkan detail internal (stack trace, query SQL)
// ke response client -- hanya dicatat ke console untuk debugging developer.
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  if (err.code === '23505') {
    // unique_violation di PostgreSQL
    return res.status(409).json({ message: 'Data sudah ada (duplikat).' });
  }
  if (err.code === '23503') {
    // foreign_key_violation
    return res.status(400).json({ message: 'Referensi data tidak valid.' });
  }

  res.status(err.status || 500).json({
    message: err.publicMessage || 'Terjadi kesalahan pada server.',
  });
}

module.exports = errorHandler;
