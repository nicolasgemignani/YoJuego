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
    // 1. Desestructuramos para separar lo que sirve y aislar el nivel viejo
    const { nombre, apellido, email, password, posicion } = req.body;

    // 2. Armamos un objeto limpio con los campos que sí queremos guardar
    const datosRegistro = {
      nombre,
      apellido,
      email,
      password,
      posicion
    };

    // 💡 Al no incluir la propiedad "nivel" en el objeto, 
    // Mongoose va a usar el `default: 5` de tu modelo automáticamente y chau "NaN".
    
    // 3. Llamamos al servicio pasando solo los datos estructurados
    await authService.registrarUsuario(datosRegistro);
    
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
  res.render('web/login', { 
    error: req.query.error,
    redirect: req.query.redirect // 👈 Le pasamos la ruta original a Handlebars
  });
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

    // 5. Redireccionar al destino original o al Home por defecto
    // 💡 CAMBIAMOS req.query por req.body
    const rutaRedireccion = req.body.redirect || '/'; 
    
    return res.redirect(rutaRedireccion);

  } catch (error) {
      // Tu catch actual está perfecto porque ya lee desde req.body!
      const origen = req.body.redirect ? `&redirect=${encodeURIComponent(req.body.redirect)}` : '';
      res.redirect(`/web/login?error=Credenciales inválidas${origen}`);
  }
};

// Método para cerrar sesión (Limpiar la cookie)
// En tu controllers/web/authWebController.js
export const cerrarSesion = (req, res) => {
  // 1. Chequeá que el nombre coincida con el que usaste en el login (sea 'jwt' o 'token')
  res.clearCookie('jwt'); 
  
  // 2. Redirección limpia (al login con flag, o a la home con el ?exito que lee tu nuevo home.hbs)
  res.redirect('/?exito=Sesión cerrada correctamente. ¡Volvé pronto!');
};