import matchService from '../../services/matchService.js';

// US04 y US05: Renderizar el Dashboard con la cartelera de partidos
export const mostrarDashboard = async (req, res) => {
  try {
    const usuarioLogueadoId = res.locals.user ? res.locals.user._id.toString() : null;

    // Traemos los partidos usando tu método del Service
    const partidos = await matchService.obtenerPartidosConEstadoVoto(usuarioLogueadoId);
    const ahora = new Date();

    const partidosFormateados = partidos.map(p => {
      // 💡 SOLUCIÓN: Limpiamos cualquier rastro de prototipos/getters extraños clonando de forma limpia
      const partido = JSON.parse(JSON.stringify(p));

      // 1. FUSIONAR FECHA Y HORA EVITANDO EL DESFASAJE UTC
      const fechaString = new Date(partido.fecha).toISOString().split('T')[0];
      const momentoPartido = new Date(`${fechaString}T${partido.hora}:00`);
      const momentoFinalizacion = new Date(momentoPartido.getTime() + 90 * 60 * 1000);

      const yaTermino = ahora > momentoFinalizacion;
      const yaEmpezo = ahora > momentoPartido; 

      // 2. Conteo Blindado (Mapea bien si son Objetos u ObjectIds)
      const totalTitulares = Array.isArray(partido.jugadores) ? partido.jugadores.length : 0;
      const maxTitulares = partido.cupoMaximo || (partido.tipoCancha ? partido.tipoCancha * 2 : 10);
      const cuposLibres = maxTitulares - totalTitulares;

      const totalSuplentes = Array.isArray(partido.suplentes) ? partido.suplentes.length : 0;
      const maxSuplentes = partido.tipoCancha || 5; 

      // 3. Cálculos de Porcentajes matemáticos limpios
      const porcentajeTitulares = maxTitulares > 0 ? Math.min((totalTitulares / maxTitulares) * 100, 100) : 0;
      const porcentajeSuplentes = maxSuplentes > 0 ? Math.min((totalSuplentes / maxSuplentes) * 100, 100) : 0;

      // 4. Armamos los Strings que va a leer el HBS directamente
      const contadorTitulares = `${totalTitulares}/${maxTitulares}`;
      const contadorSuplentesStr = `${totalSuplentes}/${maxSuplentes}`;

      // Comprobación segura de pertenencia (Contempla string puro u objeto populado)
      const esTitular = partido.jugadores?.some(j => {
        const id = j?._id ? j._id.toString() : j.toString();
        return id === usuarioLogueadoId;
      }) || false;

      const esSuplente = partido.suplentes?.some(s => {
        const id = s?._id ? s._id.toString() : s.toString();
        return id === usuarioLogueadoId;
      }) || false;

      const listaEsperaLlena = totalSuplentes >= maxSuplentes;
      const pertenecioAlPartido = esTitular || esSuplente;
      const yaInscripto = !yaEmpezo && pertenecioAlPartido;
      const puedeAnotarse = !yaEmpezo && !pertenecioAlPartido && (cuposLibres > 0 || !listaEsperaLlena);
      const puedeValorar = yaTermino && esTitular && !partido.yaVoto;

      return {
        ...partido,
        fechaFormateada: new Date(partido.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }),
        cuposLibres: cuposLibres > 0 ? cuposLibres : 0,
        estaCompleto: partido.estado === 'completo' || cuposLibres <= 0,
        listaEsperaLlena,
        
        // 📊 VARIABLES INYECTADAS EXPLICITAMENTE COMPLETAMENTE VISIBLES PARA HBS:
        contadorTitulares,
        contadorSuplentesStr,
        porcentajeTitulares,
        porcentajeSuplentes,
        
        yaTermino, // 💡 Agregado explícitamente para que funcionen los filtros .filter de abajo
        puedeValorar, 
        puedeAnotarse, 
        yaInscripto,   
        pertenecioAlPartido,
        esSuplente,
        esCreador: partido.creador?._id?.toString() === usuarioLogueadoId
      };
    });

    // =========================================================================
    // 🗓️ CONTROL DE TOLERANCIA DE 24 HORAS PARA LA CARTELERA DEL DASHBOARD
    // =========================================================================
    const unDiaAtras = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    // 1. En la cartelera principal entran los futuros Y los partidos recientes de ayer (tolerancia)
    const carteleraPrincipal = partidosFormateados.filter(p => {
      const fechaString = new Date(p.fecha).toISOString().split('T')[0];
      const momentoPartido = new Date(`${fechaString}T${p.hora}:00`);
      
      // Sigue visible si es del futuro O si pasó hace menos de 24 horas
      return !p.yaTermino || momentoPartido >= unDiaAtras;
    });

    // 2. Historial puro: partidos viejos que ya superaron el día de tolerancia
    const historialViejo = partidosFormateados.filter(p => {
      const fechaString = new Date(p.fecha).toISOString().split('T')[0];
      const momentoPartido = new Date(`${fechaString}T${p.hora}:00`);
      return p.yaTermino && momentoPartido < unDiaAtras;
    });

    // 3. Ordenamos la cartelera principal por fecha cronológica (los más próximos primero)
    carteleraPrincipal.sort((a, b) => {
      const deA = new Date(`${new Date(a.fecha).toISOString().split('T')[0]}T${a.hora}:00`);
      const deB = new Date(`${new Date(b.fecha).toISOString().split('T')[0]}T${b.hora}:00`);
      return deA - deB;
    });

    // 4. El historial viejo lo ordenamos al revés (los últimos que pasaron primero)
    historialViejo.sort((a, b) => {
      const deA = new Date(`${new Date(a.fecha).toISOString().split('T')[0]}T${a.hora}:00`);
      const deB = new Date(`${new Date(b.fecha).toISOString().split('T')[0]}T${b.hora}:00`);
      return deB - deA;
    });

    // Juntamos todo para la vista, pero asegurando que los de ayer queden arriba en la cartelera
    const carteleraFinal = [...carteleraPrincipal, ...historialViejo];
    // =========================================================================
    const successMsg = req.query.exito || req.query.success || null;
    const errorMsg = req.query.error || null;

    res.render('web/home', {
      partidos: carteleraFinal, 
      isAuthenticated: req.isAuthenticated(),
      user: res.locals.user,
      success: successMsg,  
      error: errorMsg       
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
      esTitular,
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