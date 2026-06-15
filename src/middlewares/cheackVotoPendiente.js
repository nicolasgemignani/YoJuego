import matchService from '../services/matchService.js';

export const checkVotoPendiente = async (req, res, next) => {
  try {
    // Levantamos el usuario de res.locals.user (o req.user según cómo lo manejes)
    const usuarioLogueadoId = res.locals.user ? res.locals.user._id.toString() : null;

    if (!usuarioLogueadoId) {
      return next(); // Si no está logueado, que siga de largo
    }

    // Excepciones: Si el usuario YA ESTÁ yendo a la pantalla de votar o guardando el voto,
    // no lo redireccionamos, sino entraría en un bucle infinito (un loop de redirects).
    if (req.path.includes('/votos') || req.path.includes('/logout')) {
      return next();
    }

    // Le preguntamos al servicio si este pibe debe algún voto
    const partidoPendiente = await matchService.obtenerPartidoPendienteDeVoto(usuarioLogueadoId);

    if (partidoPendiente) {
      // 🚨 ¡Cazado! Al lobby a votar de una antes de ver el dashboard.
      // Ajustá esta URL a cómo tengas definida la ruta de tu vista de votación
      return res.redirect(`/web/votos/${partidoPendiente._id}/votar`);
    }

    // Si está limpio, continúa viaje al controlador que quería ir (ej: mostrarDashboard)
    next();
  } catch (error) {
    console.error("Error en middleware checkVotoPendiente:", error);
    next(); // En caso de error, dejamos pasar para no romper la app
  }
};