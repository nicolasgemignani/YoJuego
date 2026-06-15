import { Router } from 'express';
import { mostrarPantallaVotacion, guardarValoraciones } from '../../controllers/web/voteWebController.js';
import { asegurarAutenticadoWeb } from '../../middlewares/auth.js';

const router = Router();

// 💡 URL: /web/votos/:idPartido/votar (Muestra las cartas del FIFA)
router.get('/:idPartido/votar', asegurarAutenticadoWeb, mostrarPantallaVotacion);

// 💡 URL: /web/votos/guardar (Procesa el formulario oculto)
router.post('/guardar', asegurarAutenticadoWeb, guardarValoraciones);

export default router;