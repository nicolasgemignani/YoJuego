import Match from '../models/Match.js';

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
  async obtenerPartidosActivos() {
    return await Match.find({ estado: { $ne: 'cancelado' } })
      .populate('creador', 'email')
      .populate('jugadores', 'email posicion nivel')
      .sort({ fecha: 1, hora: 1 })
      .lean(); // Convierte a objetos JS planos para Handlebars
  }

  // US06: Lógica de inscripción del jugador (Botón de unión)
  async inscribirJugador(partidoId, jugadorId) {
    const partido = await Match.findById(partidoId);
    
    if (!partido) {
      throw new Error('El partido no existe.');
    }

    if (partido.estado === 'cancelado') {
      throw new Error('No podés anotarte a un partido cancelado.');
    }

    // Verificar si ya está anotado
    const yaAnotado = partido.jugadores.some(id => id.toString() === jugadorId.toString());
    if (yaAnotado) {
      throw new Error('Ya estás anotado en este partido.');
    }

    // Verificar si hay cupo libre
    if (partido.jugadores.length >= partido.cupoMaximo) {
      throw new Error('El partido ya está completo.');
    }

    // Insertar el jugador al array
    partido.jugadores.push(jugadorId);

    // Si se llegó al límite, cambiar estado a completo
    if (partido.jugadores.length === partido.cupoMaximo) {
      partido.estado = 'completo';
    }

    return await partido.save();
  }

    // Para el contrabotón de unión: Darse de baja
    async darDeBajaJugador(partidoId, jugadorId) {
    const partido = await Match.findById(partidoId);
    
    if (!partido) {
        throw new Error('El partido no existe.');
    }

    // Filtrar el array para sacar al jugador
    const longitudOriginal = partido.jugadores.length;
    partido.jugadores = partido.jugadores.filter(id => id.toString() !== jugadorId.toString());

    if (partido.jugadores.length === longitudOriginal) {
        throw new Error('No estás anotado en este partido.');
    }

    // Si el partido estaba completo y ahora se liberó un cupo, vuelve a estar abierto
    if (partido.estado === 'completo' && partido.jugadores.length < partido.cupoMaximo) {
        partido.estado = 'abierto';
    }

    return await partido.save();
    }

    // Auxiliar para traer un solo partido detallado con sus jugadores populados
    async obtenerPartidoPorId(id) {
    return await Match.findById(id)
        .populate('creador', 'email')
        .populate('jugadores', 'email posicion nivel')
        .lean();
    }

}

export default new MatchService();