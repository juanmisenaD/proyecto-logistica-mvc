// src/controllers/authController.js
const usuarios = require('../../config/users');

class AuthController {
  static renderLogin(req, res) {
    res.render('login', { error: req.query.error || null });
  }

  static login(req, res) {
    const { usuario, clave } = req.body;
    const user = usuarios.find(u => u.usuario === usuario && u.clave === clave);

    if (!user) {
      return res.redirect('/login?error=Credenciales incorrectas');
    }

    req.session.usuario = {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol
    };

    res.redirect('/');
  }

  static logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  }
}

module.exports = AuthController;