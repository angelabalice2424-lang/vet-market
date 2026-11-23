function requireRole(role) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) return res.redirect('/login');
    if (role && user.role !== role) {
      return res.status(403).render('error', { title: 'Sin permiso', message: 'No tenés acceso a esta sección.' });
    }
    next();
  };
}

module.exports = { requireRole };
