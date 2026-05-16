import passport from 'passport';

// Middleware para la Web (Redirecciona al login si falla)
export const asegurarAutenticadoWeb = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, usuario) => {
    if (err || !usuario) {
      return res.redirect('/auth/login?error=unauthorized');
    }
    req.user = usuario;
    next();
  })(req, res, next);
};

// Middleware para la API (Devuelve un JSON 401 si falla)
export const asegurarAutenticadoApi = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, usuario) => {
    if (err || !usuario) {
      return res.status(401).json({ success: false, message: 'No autorizado, token inválido o inexistente.' });
    }
    req.user = usuario;
    next();
  })(req, res, next);
};