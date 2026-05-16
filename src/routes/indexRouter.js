import { Router } from 'express'

import authWebRouter from './web/authWebRoutes.js'

const router = Router()

router.use('/web', authWebRouter)

router.get('/', (req, res) => {
  // res.locals.isAuthenticated y res.locals.user se cargan solos gracias a nuestro middleware cargarUsuarioGlobal
  res.send(`
    <h1>⚽ Bienvenido a Yo Juego ⚽</h1>
    ${res.locals.isAuthenticated 
      ? `<p>Estás logueado como: <strong>${res.locals.user.email}</strong> (Nivel: ${res.locals.user.nivel})</p>
         <a href="/auth/logout">Cerrar Sesión</a>` 
      : `<p>No estás logueado actualmente.</p>
         <a href="/auth/login">Ir al Login</a> o <a href="/auth/register">Registrarse</a>`
    }
  `);
});

export default router