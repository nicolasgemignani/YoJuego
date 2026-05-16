import passport from '../config/passport.js';

const cargarUsuarioGlobal = (req, res, next) => {
  // Ejecutamos Passport en modo silencioso (no bloqueante)
  passport.authenticate('jwt', { session: false }, (err, usuario) => {
    if (usuario) {
      res.locals.isAuthenticated = true;
      res.locals.user = usuario;
      req.user = usuario; 
    } else {
      res.locals.isAuthenticated = false;
      res.locals.user = null;
    }
    next(); // Siempre pasa al siguiente middleware o ruta, esté logueado o no
  })(req, res, next);
};

export default cargarUsuarioGlobal;