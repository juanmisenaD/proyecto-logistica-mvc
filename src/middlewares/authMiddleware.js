// src/middlewares/authMiddleware.js

function verificarAutenticado(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  res.redirect('/login');
}

function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.session || !req.session.usuario) {
      return res.redirect('/login');
    }
    if (rolesPermitidos.includes(req.session.usuario.rol)) {
      return next();
    }
    res.status(403).send("Acceso denegado: No tienes permisos suficientes para esta sección.");
  };
}

module.exports = { verificarAutenticado, permitirRoles };