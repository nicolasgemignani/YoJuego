import passport from 'passport';

// Middleware para la Web (Redirecciona al login si falla, recordando el origen)
export const asegurarAutenticadoWeb = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, usuario) => {
    if (err || !usuario) {
      // 1. Capturamos la ruta exacta a la que intentaba entrar (ej: /partidos/65f1c...)
      const origen = encodeURIComponent(req.originalUrl);
      
      // 2. Lo redirigimos pasándole el destino en la URL
      return res.redirect(`/web/login?redirect=${origen}&error=Debés iniciar sesión para ver este contenido.`);
    }
    
    // Si el token es válido, se lo pegamos a req.user y pasamos al controlador
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