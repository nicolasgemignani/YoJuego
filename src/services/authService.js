import User from '../models/User.js';

class AuthService {
  async registrarUsuario(datosUsuario) {
    const { email, password, posicion, nivel } = datosUsuario;

    // 1. Validar si el usuario ya existe
    const usuarioExistente = await User.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    // 2. Crear el nuevo usuario (el pre-save del modelo encriptará la contraseña)
    const nuevoUsuario = new User({
      email,
      password,
      posicion,
      nivel: Number(nivel) // Nos aseguramos de que guarde un número
    });

    // 3. Guardar en la base de datos
    return await nuevoUsuario.save();
  }
}

export default new AuthService();