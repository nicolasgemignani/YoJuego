import matchService from '../../services/matchService.js';

// US04 y US05: Renderizar el Dashboard con la cartelera de partidos
export const mostrarDashboard = async (req, res) => {
  try {
    // 1. Traemos todos los partidos activos usando el servicio
    const partidos = await matchService.obtenerPartidosActivos();
    
    // ID del usuario logueado (si es que hay uno, gracias al middleware global)
    const usuarioLogueadoId = res.locals.user ? res.locals.user._id.toString() : null;

    // 2. Formateamos los partidos para facilitarle la vida a Handlebars
    const partidosFormateados = partidos.map(partido => {
      const cuposLibres = partido.cupoMaximo - partido.jugadores.length;
      
      return {
        ...partido,
        // Formateamos la fecha a algo amigable (DD/MM/YYYY) sin romper el lean object
        fechaFormateada: new Date(partido.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }),
        cuposLibres,
        estaCompleto: partido.estado === 'completo' || cuposLibres <= 0,
        // US06: Banderas lógicas para controlar qué botón mostrar en el HTML
        yaInscripto: partido.jugadores.some(j => j._id.toString() === usuarioLogueadoId),
        esCreador: partido.creador._id.toString() === usuarioLogueadoId
      };
    });

    // 3. Renderizamos la Home pasándole los partidos y mensajes si existieran en la sesión
    res.render('web/home', {
      partidos: partidosFormateados,
      error: req.query.error, // Para atrapar errores que viajen por la URL
      exito: req.query.exito   // Para atrapar mensajes de éxito
    });

  } catch (error) {
    res.render('web/home', { 
      error: 'Hubo un problema al cargar la cartelera de partidos.' 
    });
  }
};

// US06: Procesar la acción del botón de unión
export const unirseAPartido = async (req, res) => {
  try {
    const { id: partidoId } = req.params;
    
    // Doble check de seguridad: si no hay usuario en res.locals, no lo dejamos pasar
    if (!res.locals.isAuthenticated) {
      return res.redirect('/web/login?error=Debés iniciar sesión para anotarte a un partido.');
    }

    const usuarioId = res.locals.user._id;

    // Ejecutamos la lógica del servicio
    await matchService.inscribirJugador(partidoId, usuarioId);

    // Si todo sale bien, volvemos a la home avisando el éxito
    res.redirect('/?exito=¡Te anotaste al partido con éxito! Prepará los botines.');

  } catch (error) {
    // Si el servicio tira un error (ej: "Ya estás anotado" o "Está completo"), lo mandamos por la URL
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
};

// Mostrar el detalle de un partido específico con su lista de jugadores
export const mostrarDetallePartido = async (req, res) => {
  try {
    const partido = await matchService.obtenerPartidoPorId(req.params.id);
    if (!partido) {
      return res.redirect('/?error=Partido no encontrado.');
    }

    const usuarioLogueadoId = res.locals.user ? res.locals.user._id.toString() : null;
    const cuposLibres = partido.cupoMaximo - partido.jugadores.length;

    const partidoFormateado = {
      ...partido,
      fechaFormateada: new Date(partido.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }),
      cuposLibres,
      estaCompleto: partido.estado === 'completo' || cuposLibres <= 0,
      yaInscripto: partido.jugadores.some(j => j._id.toString() === usuarioLogueadoId),
      esCreador: partido.creador._id.toString() === usuarioLogueadoId
    };

    res.render('web/partidoDetalle', { partido: partidoFormateado });
  } catch (error) {
    res.redirect('/?error=Error al cargar el detalle del partido.');
  }
};

// Procesar la acción de bajarse del partido
export const bajarseDePartido = async (req, res) => {
  try {
    const { id: partidoId } = req.params;
    const usuarioId = res.locals.user._id;

    await matchService.darDeBajaJugador(partidoId, usuarioId);

    res.redirect(`/?exito=Te bajaste del partido correctamente.`);
  } catch (error) {
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
};