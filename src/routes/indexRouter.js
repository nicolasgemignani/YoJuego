import { Router } from 'express'

import authWebRouter from './web/authWebRoutes.js'
import homeWebRouter from './web/homeWebRoutes.js'
import matchRoutes from './web/matchWebRoutes.js';

const router = Router()

router.use('/web', authWebRouter)
router.use('/', homeWebRouter)
router.use('/partidos', matchRoutes);

export default router