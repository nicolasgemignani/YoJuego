import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import hbs from 'hbs';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import conectarDB from './config/db.js';
import { variables } from './config/env.js';

import indexRouter from './routes/indexRouter.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cargarUsuarioGlobal from './middlewares/cargarUsuario.js';

const app = express();

// Middlewares de lectura de datos
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser(variables.COOKIEPARSER));

// Inicializar Passport 
app.use(passport.initialize());

// Middlewares globales de UI / Contexto (Ahora sí queda ultra limpio)
app.use(cargarUsuarioGlobal);

// CONFIGURACIÓN DE HANDLEBARS
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// REGISTRA EL HELPER EN HBS
hbs.registerHelper('logicaSumaUno', (index) => {
  return index + 1;
});

// Definir el layout por defecto de forma global
app.set('view options', { layout: 'layouts/main' });
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Intentar conectar la Base de Datos antes de levantar el servidor
await conectarDB();

// Rutas de la aplicacion
app.use(indexRouter)

// Escuchar en el puerto configurado
app.listen(variables.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${variables.PORT}`);
});