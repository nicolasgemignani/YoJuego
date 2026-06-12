import { Router } from 'express';
import { mostrarDashboard } from '../../controllers/web/matchWebController.js'; // 👈 Cambiamos el controlador

const router = Router();

// Ahora la raíz ejecuta el dashboard dinámico (US04 y US05)
router.get('/', mostrarDashboard);

export default router;