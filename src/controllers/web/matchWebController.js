import matchService from '../../services/matchService.js';

// US04 y US05: Renderizar el Dashboard con la cartelera de partidos
export const mostrarDashboard = async (req, res) => {
  try {
    const usuarioLogueadoId = res.locals.user ? res.locals.user._id.toString() : null;

    // 💡 LLAMADO AL SERVICIO: Le pasamos el ID y nos devuelve los partidos con 'yaVoto'
    const partidos = await matchService.obtenerPartidosConEstadoVoto(usuarioLogueadoId);
    
    const ahora = new Date();

    const partidosFormateados = partidos.map(partido => {
      // 1. FUSIONAR FECHA Y HORA EVITANDO EL DESFASAJE UTC
      const fechaString = new Date(partido.fecha).toISOString().split('T')[0];
      const momentoPartido = new Date(`${fechaString}T${partido.hora}:00`);
      const momentoFinalizacion = new Date(momentoPartido.getTime() + 90 * 60 * 1000);

      // 2. ¿Ya pasó el tiempo del partido?
      const yaTermino = ahora > momentoFinalizacion;

      // 3. Lógica de cupos e inscripción original tuya
      const cuposLibres = partido.cupoMaximo - partido.jugadores.length;
      
      const esTitular = partido.jugadores?.some(j => j?._id?.toString() === usuarioLogueadoId) || false;
      const esSuplente = partido.suplentes?.some(s => s?._id?.toString() === usuarioLogueadoId) || false;

      const limiteSuplentes = partido.tipoCancha;
      const cantidadSuplentes = partido.suplentes?.length || 0;
      const listaEsperaLlena = cantidadSuplentes >= limiteSuplentes;
      const contadorSuplentes = `${cantidadSuplentes}/${limiteSuplentes}`;

      // 💡 LÓGICA DE VOTACIÓN: Terminó, jugó de titular Y el servicio nos dice que NO VOTÓ todavía
      const puedeValorar = yaTermino && esTitular && !partido.yaVoto;

      return {
        ...partido,
        fechaFormateada: new Date(partido.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }),
        cuposLibres: cuposLibres > 0 ? cuposLibres : 0,
        estaCompleto: partido.estado === 'completo' || cuposLibres <= 0,
        listaEsperaLlena,
        contadorSuplentes,
        puedeValorar, 
        yaInscripto: !yaTermino && (esTitular || esSuplente),
        esSuplente,
        esCreador: partido.creador?._id?.toString() === usuarioLogueadoId
      };
    });

    res.render('web/home', {
      partidos: partidosFormateados,
      error: req.query.error,
      exito: req.query.exito || req.query.success
    });

  } catch (error) {
    console.error("Error en mostrarDashboard:", error);
    res.render('web/home', { 
      error: 'Hubo un problema al cargar la cartelera de partidos.' 
    });
  }
};

// US06 & US15: Procesar la acción de unirse (Titular o Suplente automático)
export const unirseAPartido = async (req, res) => {
  try {
    const { id: partidoId } = req.params;
    
    if (!res.locals.isAuthenticated) {
      return res.redirect('/web/login?error=Debés iniciar sesión para anotarte a un partido.');
    }

    const usuarioId = res.locals.user._id;

    const { tipo } = await matchService.inscribirJugador(partidoId, usuarioId);

    const mensaje = tipo === 'titular' 
      ? '¡Te anotaste al partido con éxito! Prepará los botines.' 
      : 'El partido estaba completo, pero entraste en la lista de espera como suplente. ⏳';

    res.redirect(`/?exito=${encodeURIComponent(mensaje)}`);

  } catch (error) {
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
};

// Mostrar el detalle de un partido específico con su lista de jugadores y suplentes
export const mostrarDetallePartido = async (req, res) => {
  try {
    const partido = await matchService.obtenerPartidoPorId(req.params.id);
    if (!partido) {
      return res.redirect('/?error=Partido no encontrado.');
    }

    const usuarioLogueadoId = res.locals.user ? res.locals.user._id.toString() : null;
    const cuposLibres = partido.cupoMaximo - partido.jugadores.length;

    // ⚡ Corregido: Agregado ?. para que no tire error si el array o el id vienen vacíos
    const esTitular = partido.jugadores?.some(j => j?._id?.toString() === usuarioLogueadoId) || false;
    const esSuplente = partido.suplentes?.some(s => s?._id?.toString() === usuarioLogueadoId) || false;

    // 💡 CÁLCULO DE SUPLENTES Y CONTADORES EN DETALLE
    const limiteSuplentes = partido.tipoCancha;
    const cantidadSuplentes = partido.suplentes?.length || 0;
    const listaEsperaLlena = cantidadSuplentes >= limiteSuplentes;
    const contadorSuplentes = `${cantidadSuplentes}/${limiteSuplentes}`;

    const partidoFormateado = {
      ...partido,
      fechaFormateada: new Date(partido.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }),
      cuposLibres,
      estaCompleto: partido.estado === 'completo' || cuposLibres <= 0,
      listaEsperaLlena,
      contadorSuplentes, // 👈 Pasamos el contador también al detalle por si lo querés usar
      yaInscripto: esTitular || esSuplente,
      esSuplente,
      esCreador: partido.creador?._id?.toString() === usuarioLogueadoId
    };

    res.render('web/partidoDetalle', { partido: partidoFormateado });
  } catch (error) {
    res.redirect('/?error=Error al cargar el detalle del partido.');
  }
};

// Procesar la acción de bajarse del partido (Con lógica FIFO automática)
export const bajarseDePartido = async (req, res) => {
  try {
    const { id: partidoId } = req.params;
    const usuarioId = res.locals.user._id;

    // El servicio procesa la baja y nos devuelve qué pasó con la cola de espera
    const { mensaje } = await matchService.darDeBajaJugador(partidoId, usuarioId);

    res.redirect(`/?exito=${encodeURIComponent(mensaje)}`);
  } catch (error) {
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
};