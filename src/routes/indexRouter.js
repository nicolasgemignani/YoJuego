import { Router } from 'express'

import authWebRouter from './web/authWebRoutes.js'
import homeWebRouter from './web/homeWebRoutes.js'
import matchWebRoutes from './web/matchWebRoutes.js';
import voteWebRoutes from './web/voteWebRoutes.js';

import { checkVotoPendiente } from '../middlewares/cheackVotoPendiente.js'; // Importamos el middleware para verificar votos pendientes

const router = Router()

router.use('/web', authWebRouter)

router.use(checkVotoPendiente) // Aplicamos el middleware a todas las rutas siguientes para verificar votos pendientes antes de acceder a cualquier página web
router.use('/', homeWebRouter)
router.use('/partidos', matchWebRoutes);
router.use("/web/votos", voteWebRoutes);

export default router