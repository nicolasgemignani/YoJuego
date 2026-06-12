import { Schema, model } from 'mongoose';

const MatchSchema = new Schema({
  fecha: {
    type: Date,
    required: [true, 'La fecha del partido es obligatoria.']
  },
  hora: {
    type: String,
    required: [true, 'La hora del partido es obligatoria.'],
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM).'] // Valida formato 24hs (Ej: 21:30)
  },
  lugar: {
    type: String,
    required: [true, 'El complejo deportivo o dirección es obligatorio.'],
    trim: true
  },
  tipoCancha: {
    type: Number,
    required: [true, 'El tipo de cancha es obligatorio (5, 7, 11).'],
    enum: [5, 7, 11] // Solo permitimos estos formatos de fútbol
  },
  cupoMaximo: {
    type: Number,
    required: true
  },
  creador: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Conecta con el modelo de Usuarios (el que organiza)
    required: true
  },
  jugadores: [{
    type: Schema.Types.ObjectId,
    ref: 'User' // Array de IDs de los jugadores que se van anotando
  }],
  estado: {
    type: String,
    enum: ['abierto', 'completo', 'cancelado'],
    default: 'abierto'
  }
}, {
  timestamps: true // Nos crea automáticamente 'createdAt' y 'updatedAt'
});

// Middleware PRE-VALIDATE: Calcula automáticamente el cupo de jugadores según la cancha
// Si es Fútbol 5 -> entran 10, si es Fútbol 11 -> entran 22.
// Middleware PRE-VALIDATE moderno (sin callback manual)
MatchSchema.pre('validate', function() {
  if (this.tipoCancha && !this.cupoMaximo) {
    this.cupoMaximo = this.tipoCancha * 2;
  }
});

// Métodos de ayuda (Helper methods) para usar en los controladores
MatchSchema.methods.cuposDisponibles = function() {
  return this.cupoMaximo - this.jugadores.length;
};

const Match = model('Match', MatchSchema);
export default Match;