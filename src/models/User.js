import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio.'],
    unique: true,
    trim: true,
    lowercase: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio.'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio.'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria.']
  },
  posicion: {
    type: String,
    enum: ['Arquero', 'Defensor', 'Mediocampista', 'Delantero', 'No definido'],
    default: 'No definido'
  },
  // 💡 NUEVO: Puntos internos para calcular el rango de habilidad
  rangoPuntos: {
    type: Number,
    default: 0,
    min: 0
  },
  rango: {
    type: String,
    enum: ['Bronce', 'Plata', 'Oro'],
    default: 'Bronce'
  },
  // 💡 NUEVO: El honor mide únicamente la conducta y reputación humana
  honor: {
    type: Number,
    default: 50,
    min: 0 // Para que las penalizaciones por no votar no lo dejen en negativo
  },
  // 💡 NUEVO: Medallas rebautizadas con los nombres reales del fútbol
  medallas: {
    jugadorPartido: { type: Number, default: 0 },
    actitudEsfuerzo: { type: Number, default: 0 },
    buenCompanero: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// =========================================================================
// CAPA DE CLASE (Encapsulamos el comportamiento del objeto Usuario)
// =========================================================================

class UserClass {
  // --- Métodos de Instancia ---

  // Encriptar la contraseña antes de guardarla
  async encriptarPassword() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Comparar contraseñas cuando intente loguearse
  async verificarPassword(passwordCandidata) {
    return await bcrypt.compare(passwordCandidata, this.password);
  }

  // 💡 ACTUALIZADO: El rango ahora se evalúa según los "rangoPuntos", no por el honor
  actualizarRango() {
    if (this.rangoPuntos >= 300) this.rango = 'Oro';
    else if (this.rangoPuntos >= 100) this.rango = 'Plata';
    else this.rango = 'Bronce';
  }

  // 💡 ACTUALIZADO: Lógica de medallas según el nuevo sistema de 2 ejes
  recibirMedalla(tipoMedalla) {
    if (tipoMedalla === 'jugadorPartido') {
      this.medallas.jugadorPartido += 1;
      this.rangoPuntos += 10; // 🔥 Suma directo al Rango Competitivo
    }
    
    if (tipoMedalla === 'actitudEsfuerzo') {
      this.medallas.actitudEsfuerzo += 1;
      this.rangoPuntos += 5;  // 💪 Suma directo al Rango Competitivo
    }
    
    if (tipoMedalla === 'buenCompanero') {
      this.medallas.buenCompanero += 1;
      this.honor += 5;        // 🤝 Suma únicamente al Honor Social
    }

    // Evaluamos automáticamente si sube de Rango (Bronce -> Plata -> Oro)
    this.actualizarRango();
  }

  // 💡 NUEVO: Método para aplicar la penalización si el pibe skipea la votación
  penalizarPorNoVotar() {
    this.honor = Math.max(0, this.honor - 2); // Le resta 2 puntos cuidando el mínimo de 0
  }

  // --- Métodos Estáticos / De Clase ---

  static async buscarPorEmail(email) {
    return await this.findOne({ email });
  }

  static async buscarPorId(id) {
    return await this.findById(id).select('-password');
  }

  static async obtenerTodos() {
    return await this.find().select('-password');
  }
}

// Vinculamos la clase al esquema de Mongoose
UserSchema.loadClass(UserClass);

// Middleware pre-save
UserSchema.pre('save', async function() {
  try {
    await this.encriptarPassword();
  } catch (error) {
    throw(error);
  }
});

const User = mongoose.model('User', UserSchema);
export default User;