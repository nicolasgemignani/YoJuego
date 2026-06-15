export const mostrarHome = async (req, res) => {
  try {
    // 1. Buscamos los partidos (asegurate de hacer populate de 'jugadores' para tener los IDs)
    const partidos = await Match.find().populate('jugadores').lean(); 
    const usuarioLogueadoId = req.user ? req.user._id.toString() : null;

    // 2. Mapeamos los partidos para agregar la lógica del botón
    const partidosProcesados = partidos.map(partido => {
      // Condición 1: El partido tiene que estar finalizado
      const estaFinalizado = partido.estado === 'Finalizado'; // O como manejes el string del estado

      // Condición 2: El usuario tiene que estar en la lista de jugadores titulares
      const jugoElPartido = usuarioLogueadoId && partido.jugadores.some(
        jugador => jugador._id.toString() === usuarioLogueadoId
      );

      return {
        ...partido,
        // El botón solo se habilita si se cumplen ambas condiciones
        puedeValorar: estaFinalizado && jugoElPartido,
        
        // Mantener las propiedades que ya usabas en tu vista
        yaInscripto: usuarioLogueadoId && partido.jugadores.some(j => j._id.toString() === usuarioLogueadoId), // Ajustá si usás otra lógica para suplentes
        estaCompleto: partido.jugadores.length >= 10, // Ejemplo
      };
    });

    res.render('web/home', {
      partidos: partidosProcesados,
      isAuthenticated: !!req.user
    });

  } catch (error) {
    res.status(500).render('web/error', { error: error.message });
  }
};