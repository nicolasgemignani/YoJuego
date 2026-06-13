import User from '../models/User.js';

class AuthService {
  async registrarUsuario(datosUsuario) {
    // 💡 1. Capturamos los campos nuevos (nombre, apellido) y sacamos 'nivel' de la desestructuración
    const { nombre, apellido, email, password, posicion } = datosUsuario;

    // 2. Validar si el usuario ya existe
    const usuarioExistente = await User.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    // 3. Crear el nuevo usuario pasándole la estructura prolija
    const nuevoUsuario = new User({
      nombre,
      apellido,
      email,
      password,
      posicion
    });

    // 4. Guardar en la base de datos
    return await nuevoUsuario.save();
  }
}

export default new AuthService();