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
    trim: true // Borra espacios vacíos locos al principio o final
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
  nivel: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  honor: {
    type: Number,
    default: 50
  },
  rango: {
    type: String,
    enum: ['Bronce', 'Plata', 'Oro'],
    default: 'Bronce'
  },
  medallas: {
    crack: { type: Number, default: 0 },
    poneHuevo: { type: Number, default: 0 },
    amistoso: { type: Number, default: 0 }
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
    if (this.honor >= 150) this.rango = 'Oro';      // Subir a Oro requiere esfuerzo
    else if (this.honor >= 80) this.rango = 'Plata'; // Plata es alcanzable con un par de partidos frentes
    else this.rango = 'Bronce';                      // Si caen abajo de 80 (o arrancan en 50), son Bronce
  }

  recibirMedalla(tipoMedalla) {
    // 1. Sumamos al contador específico según el tipo que venga
    if (tipoMedalla === 'crack') this.medallas.crack += 1;
    if (tipoMedalla === 'poneHuevo') this.medallas.poneHuevo += 1;
    if (tipoMedalla === 'amistoso') this.medallas.amistoso += 1;

    // 2. Cada medalla que te dan los pibes te suma, por ejemplo, 10 puntos de Honor
    this.honor += 10;

    // 3. Evaluamos automáticamente si con este nuevo honor el jugador sube de rango (Bronce -> Plata -> Oro)
    this.actualizarRango();
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