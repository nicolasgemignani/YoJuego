import Match from '../models/Match.js';
import Vote from '../models/Vote.js'; // Importamos el modelo de votos para la función de obtenerPartidosConEstadoVoto

class MatchService {
  
  // US04: Crear un partido nuevo
  async crearPartido(datosPartido, creadorId) {
    const { fecha, hora, lugar, tipoCancha } = datosPartido;
    
    const nuevoPartido = new Match({
      fecha,
      hora,
      lugar,
      tipoCancha,
      creador: creadorId
    });

    return await nuevoPartido.save();
  }

  // US04 y US05: Traer la cartelera de partidos activos con sus jugadores vinculados
  // 💡 Modificado: Ahora populamos suplentes también por si queremos mostrar contadores en la Home
  async obtenerPartidosActivos() {
    return await Match.find({ estado: { $ne: 'cancelado' } })
      .populate('creador', 'nombre apellido email') // Si querés usar el nombre del creador
      .populate('jugadores', 'nombre apellido email posicion rango honor') // 👈 SUMAMOS NOMBRE Y APELLIDO
      .populate('suplentes', 'nombre apellido email posicion rango honor')
      .sort({ fecha: 1, hora: 1 })
      .lean();
  }

  // US06 & US15: Lógica de inscripción del jugador (Titular o Suplente automático)
  async inscribirJugador(partidoId, jugadorId) {
    const partido = await Match.findById(partidoId);
    
    if (!partido) {
      throw new Error('El partido no existe.');
    }

    if (partido.estado === 'cancelado') {
      throw new Error('No podés anotarte a un partido cancelado.');
    }

    // ⚡ Delegamos la lógica FIFO, validaciones e inserción al método del modelo
    const resultado = partido.anotarJugador(jugadorId);

    await partido.save();
    
    // Retornamos el resultado por si el controlador quiere mandar un mensaje personalizado
    // Ej: "Te anotaste como titular" o "Entraste a la cola de espera como suplente"
    return { partido, ...resultado };
  }

  // US06 & US07: Darse de baja (Con traspaso automático FIFO de suplente a titular)
  async darDeBajaJugador(partidoId, jugadorId) {
    const partido = await Match.findById(partidoId);
    
    if (!partido) {
      throw new Error('El partido no existe.');
    }

    // ⚡ Toda la complejidad de sacar al jugador y ascender al suplente ocurre acá adentro
    const resultado = partido.darDeBajaJugador(jugadorId);

    await partido.save();
    
    return { partido, ...resultado };
  }

  // Auxiliar para traer un solo partido detallado con sus jugadores y suplentes populados
  async obtenerPartidoPorId(id) {
    return await Match.findById(id)
      .populate('creador', 'nombre apellido email')
      .populate('jugadores', 'nombre apellido email posicion rango honor') // 👈 SUMAMOS NOMBRE Y APELLIDO
      .populate('suplentes', 'nombre apellido email posicion rango honor') // 👈 SUMAMOS NOMBRE Y APELLIDO
      .lean();
  }

  async obtenerPartidosConEstadoVoto(usuarioLogueadoId) {
    // 1. Buscamos los partidos activos e inyectamos los populate necesarios (Igual que en obtenerPartidosActivos)
    const partidos = await Match.find({ estado: { $ne: 'cancelado' } })
      .populate('creador', 'nombre apellido email')
      .populate('jugadores', 'nombre apellido email posicion rango honor')
      .populate('suplentes', 'nombre apellido email posicion rango honor') // 💡 CLAVE: Ahora sí exponemos los suplentes
      .lean();

    if (!usuarioLogueadoId) {
      // Si no hay usuario logueado, ninguno tiene votos registrados
      return partidos.map(p => ({ ...p, yaVoto: false }));
    }

    // 2. Buscamos qué partidos de esta lista ya fueron votados por este usuario
    const partidosIds = partidos.map(p => p._id);
    const votosEmitidos = await Vote.find({
      votanteId: usuarioLogueadoId,
      partidoId: { $in: partidosIds }
    }).lean();

    // Creamos un Set con los IDs de los partidos ya votados para buscar rápido
    const partidosVotadosSet = new Set(votosEmitidos.map(v => v.partidoId.toString()));

    // 3. Devolvemos los partidos inyectándole la propiedad 'yaVoto'
    return partidos.map(partido => {
      return {
        ...partido,
        yaVoto: partidosVotadosSet.has(partido._id.toString())
      };
    });
  }

  // Busca si el usuario debe la votación de algún partido en el que haya jugado
  async obtenerPartidoPendienteDeVoto(usuarioLogueadoId) {
    if (!usuarioLogueadoId) return null;

    // 1. Buscamos todos los partidos de la base de datos
    const partidos = await Match.find().populate('jugadores').lean();
    const ahora = new Date();

    // 2. Filtramos los partidos que ya terminaron (hace más de 90 min) y donde el usuario fue TITULAR
    const partidosJugadosYTerminados = partidos.filter(partido => {
      const fechaString = new Date(partido.fecha).toISOString().split('T')[0];
      const momentoPartido = new Date(`${fechaString}T${partido.hora}:00`);
      const momentoFinalizacion = new Date(momentoPartido.getTime() + 90 * 60 * 1000);
      const yaTermino = ahora > momentoFinalizacion;

      const esTitular = partido.jugadores?.some(j => j?._id?.toString() === usuarioLogueadoId.toString()) || false;

      return yaTermino && esTitular;
    });

    if (partidosJugadosYTerminados.length === 0) return null;

    // 3. De esos partidos que jugó, nos fijamos en la colección de Votos si ya dejó su huella
    for (const partido of partidosJugadosYTerminados) {
      const yaVoto = await Vote.exists({ 
        partidoId: partido._id, 
        votanteId: usuarioLogueadoId 
      });

      // 🔥 Si NO votó, encontramos al culpable. Retornamos este partido inmediatamente para obligarlo a votar.
      if (!yaVoto) {
        return partido; 
      }
    }

    return null; // Está al día con todos los partidos
  }
}

export default new MatchService();