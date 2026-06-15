import mongoose from 'mongoose';

const VoteSchema = new mongoose.Schema({
  partidoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  votanteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receptorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipoMedalla: {
    type: String,
    enum: ['jugadorPartido', 'actitudEsfuerzo', 'buenCompanero'],
    required: true
  }
}, { 
  timestamps: true 
});

// Índice compuesto para evitar que un usuario le dé la MISMA medalla al MISMO jugador en el MISMO partido
VoteSchema.index({ partidoId: 1, votanteId: 1, receptorId: 1, tipoMedalla: 1 }, { unique: true });

const Vote = mongoose.model('Vote', VoteSchema);
export default Vote;