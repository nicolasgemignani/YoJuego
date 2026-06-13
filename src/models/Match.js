import { Schema, model } from 'mongoose';

const MatchSchema = new Schema({
  fecha: {
    type: Date,
    required: [true, 'La fecha del partido es obligatoria.']
  },
  hora: {
    type: String,
    required: [true, 'La hora del partido es obligatoria.'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM).']
  },
  lugar: {
    type: String,
    required: [true, 'El complejo deportivo o dirección es obligatorio.'],
    trim: true
  },
  tipoCancha: {
    type: Number,
    required: [true, 'El tipo de cancha es obligatorio (5, 7, 11).'],
    enum: [5, 7, 11]
  },
  cupoMaximo: {
    type: Number,
    required: true
  },
  creador: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jugadores: [{
    type: Schema.Types.ObjectId,
    ref: 'User' // Convocados titulares
  }],
  // 👇 NUEVO: Array de suplentes (Cola de espera FIFO)
  suplentes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  estado: {
    type: String,
    enum: ['abierto', 'completo', 'cancelado'],
    default: 'abierto'
  }
}, {
  timestamps: true
});

// Middleware PRE-VALIDATE
MatchSchema.pre('validate', function() {
  if (this.tipoCancha && !this.cupoMaximo) {
    this.cupoMaximo = this.tipoCancha * 2;
  }
});

// =========================================================================
// MÉTODOS DE INSTANCIA (Lógica intrínseca del Partido)
// =========================================================================

// Helper para saber cuántos lugares titulares quedan
MatchSchema.methods.cuposDisponibles = function() {
  const disponibles = this.cupoMaximo - this.jugadores.length;
  return disponibles > 0 ? disponibles : 0;
};

// 👇 NUEVO: Manejar la inscripción automática (Titular o Suplente)
MatchSchema.methods.anotarJugador = function(usuarioId) {
  const idStr = usuarioId.toString();

  // 1. Validar que no esté ya anotado en ninguna de las dos listas
  const yaEsTitular = this.jugadores.some(id => id.toString() === idStr);
  const yaEsSuplente = this.suplentes.some(id => id.toString() === idStr);

  if (yaEsTitular || yaEsSuplente) {
    throw new Error('Ya estás inscrito en este partido.');
  }

  // 2. Si quedan cupos libres, entra derecho como titular
  if (this.jugadores.length < this.cupoMaximo) {
    this.jugadores.push(usuarioId);
    
    // Si se llenó el último cupo con este jugador, pasamos el estado a completo
    if (this.jugadores.length === this.cupoMaximo) {
      this.estado = 'completo';
    }
    return { tipo: 'titular' };
  } else {
    // 3. ⏳ Si no hay cupo titular, evaluamos el límite de la cola de espera
    // El límite de suplentes es igual a los jugadores de un equipo entero (this.tipoCancha: 5, 7 u 11)
    const limiteSuplentes = this.tipoCancha;

    if (this.suplentes.length >= limiteSuplentes) {
      throw new Error('El partido y la lista de espera están completamente llenos.');
    }

    // Si tiene lugar en la cola, se encola
    this.suplentes.push(usuarioId);

    // Si con este suplente se llenó también la lista de espera, nos aseguramos de que figure completo
    if (this.suplentes.length === limiteSuplentes) {
      this.estado = 'completo';
    }

    return { tipo: 'suplente' };
  }
};

// 👇 NUEVO: US07 Lógica FIFO Estricta para dar de baja y traspasar suplente
MatchSchema.methods.darDeBajaJugador = function(usuarioId) {
  const idStr = usuarioId.toString();

  // Caso A: El jugador que se baja es un Suplente
  const esSuplente = this.suplentes.some(id => id.toString() === idStr);
  if (esSuplente) {
    this.suplentes = this.suplentes.filter(id => id.toString() !== idStr);
    return { mensaje: 'Te bajaste de la lista de suplentes.' };
  }

  // Caso B: El jugador que se baja es un Titular
  const esTitular = this.jugadores.some(id => id.toString() === idStr);
  if (!esTitular) {
    throw new Error('No estás anotado en este partido.');
  }

  // Lo removemos de los titulares
  this.jugadores = this.jugadores.filter(id => id.toString() !== idStr);

  // ⚡ US07: Si hay pibes en la cola de espera, el primero (FIFO) asciende a titular
  if (this.suplentes.length > 0) {
    const primerSuplente = this.suplentes.shift(); // Saca al primero de la cola
    this.jugadores.push(primerSuplente); // Lo mete a la cancha de titular
    
    // El estado sigue 'completo' porque el lugar se ocupó al toque
    return { mensaje: 'Te bajaste del partido. Un suplente tomó tu lugar como titular.' };
  }

  // Si no había suplentes, el partido vuelve a estar abierto
  this.estado = 'abierto';
  return { mensaje: 'Te bajaste del partido correctamente. Se liberó un cupo.' };
};

const Match = model('Match', MatchSchema);
export default Match;