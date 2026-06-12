import { Router } from 'express';
import { unirseAPartido, mostrarDetallePartido, bajarseDePartido } from '../../controllers/web/matchWebController.js';
import { asegurarAutenticadoWeb } from '../../middlewares/auth.js';

const router = Router();

// US06: Ruta para procesar la inscripción de un jugador a un partido específico
router.post('/:id/unirse', unirseAPartido);
// Nueva: Ver detalle del partido (GET) - Ej: /partidos/65f1c...
router.get('/:id',asegurarAutenticadoWeb ,mostrarDetallePartido);

// Nueva: Bajarse del partido (POST)
router.post('/:id/bajarse', bajarseDePartido);
export default router;