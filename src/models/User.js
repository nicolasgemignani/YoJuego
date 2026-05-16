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
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria.']
  },
  posicion: {
    type: String,
    enum: ['Arquero', 'Defensor', 'Mediocampista', 'Delantero', 'No definido'],
    default: 'No definido'
  },
  nivel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  honor: {
    type: Number,
    default: 0
  },
  rango: {
    type: String,
    enum: ['Bronce', 'Plata', 'Oro'],
    default: 'Bronce'
  }
}, { 
  timestamps: true // Nos crea automáticamente createdAt y updatedAt en Mongo
});

// =========================================================================
// CAPA DE CLASE (Encapsulamos el comportamiento del objeto Usuario)
// =========================================================================

class UserClass {
  // --- Métodos de Instancia (Operan sobre un usuario específico) ---

  // Encriptar la contraseña antes de guardarla
  async encriptarPassword() {
    // Si la contraseña no se modificó (por ejemplo, el usuario solo cambió su posición), no la volvemos a encriptar
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Comparar contraseñas cuando intente loguearse
  async verificarPassword(passwordCandidata) {
    return await bcrypt.compare(passwordCandidata, this.password);
  }

  // Lógica de negocio intrínseca: subir de rango según el honor acumulado
  actualizarRango() {
    if (this.honor >= 100) this.rango = 'Oro';
    else if (this.honor >= 50) this.rango = 'Plata';
    else this.rango = 'Bronce';
  }


  // --- Métodos Estáticos / De Clase (Operan sobre la colección completa) ---

  // Buscar un usuario por su email de forma semántica
  static async buscarPorEmail(email) {
    return await this.findOne({ email });
  }

  // Buscar un usuario por su ID excluyendo la contraseña por seguridad
  static async buscarPorId(id) {
    return await this.findById(id).select('-password');
  }

  // Traer todos los usuarios (útil para la lista de jugadores) sin la contraseña
  static async obtenerTodos() {
    return await this.find().select('-password');
  }
}

// Vinculamos la clase al esquema de Mongoose
UserSchema.loadClass(UserClass);

// Middleware pre-save: Justo antes de impactar en la BD, ejecuta la encriptación
UserSchema.pre('save', async function() {
  try {
    await this.encriptarPassword();
  } catch (error) {
    throw(error);
  }
});

const User = mongoose.model('User', UserSchema);
export default User;