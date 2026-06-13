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
}

export default new MatchService();