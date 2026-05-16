import authService from "../../services/authService.js";
import User from '../../models/User.js'
import tokenService from '../../services/tokenService.js';

// Mostrar el formulario de registro (GET)
export const mostrarRegistro = (req, res) => {
  res.render('web/register');
};

// Procesar los datos del formulario (POST)
export const procesarRegistro = async (req, res) => {
  try {
    // Llamamos al servicio pasando todo el req.body (email, password, posicion, nivel)
    await authService.registrarUsuario(req.body);
    
    // Si sale bien, lo mandamos al login avisando por la URL que fue exitoso
    res.redirect('/web/login?registered=true');
  } catch (error) {
    // Si hay un error (ej: email duplicado), volvemos a mostrar el formulario 
    // pasándole el mensaje de error para mostrarlo en el HTML, y los datos viejos para que no tenga que reescribir todo
    res.render('web/register', { 
      error: error.message,
      valores: req.body 
    });
  }
};

// Pantalla de login temporal para la redirección
export const mostrarLogin = (req, res) => {
  const registradoExitosamente = req.query.registered === 'true';
  res.render('web/login', { registradoExitosamente });
};

// Procesar el formulario de Login (POST)
export const procesarLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar al usuario
    const usuario = await User.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('Credenciales inválidas.');
    }

    // 2. Verificar contraseña con el método de instancia que creamos
    const esValida = await usuario.verificarPassword(password);
    if (!esValida) {
      throw new Error('Credenciales inválidas.');
    }

    // 3. Generar el JWT usando nuestro servicio
    const token = tokenService.generarAccessToken(usuario._id);

    // 4. Guardar el JWT en una cookie segura HTTPOnly
    res.cookie('jwt', token, {
      httpOnly: true, // El navegador no permite que JS malicioso lea esta cookie
      secure: process.env.NODE_ENV === 'production', // Solo viaja por HTTPS en producción
      maxAge: 15 * 60 * 1000 // Expira en 15 minutos (igual que el token)
    });

    // 5. Redireccionar al Home o Dashboard del juego
    res.redirect('/');
  } catch (error) {
    res.render('web/login', {
      error: error.message,
      valores: req.body
    });
  }
};

// Método para cerrar sesión (Limpiar la cookie)
export const cerrarSesion = (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/web/login?logout=true');
};