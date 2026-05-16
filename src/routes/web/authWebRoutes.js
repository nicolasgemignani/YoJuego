import { Router } from 'express';
import { 
  mostrarRegistro, 
  procesarRegistro, 
  mostrarLogin, 
  procesarLogin, 
  cerrarSesion 
} from '../../controllers/web/authWebController.js';

const router = Router();

router.get('/register', mostrarRegistro);
router.post('/register', procesarRegistro);

// Login
router.get('/login', mostrarLogin);
router.post('/login', procesarLogin);

// Logout
router.get('/logout', cerrarSesion);

export default router;