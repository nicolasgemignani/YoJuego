import jwt from 'jsonwebtoken';
import { variables } from '../config/env.js';

class TokenService {
  // Generar Token de Acceso (Expira en 15 minutos)
  generarAccessToken(usuarioId) {
    return jwt.sign({ id: usuarioId }, variables.PRIVATE_KEY, {
      expiresIn: '15m'
    });
  }

  // Generar Token de Refresco (Expira en 7 días para no perder la sesión)
  generarRefreshToken(usuarioId) {
    return jwt.sign({ id: usuarioId }, variables.REFRESH_KEY, {
      expiresIn: '7d'
    });
  }

  // Verificar un token manualmente si hiciera falta
  verificarToken(token, esRefresh = false) {
    const clave = esRefresh ? variables.REFRESH_KEY : variables.PRIVATE_KEY;
    try {
      return jwt.verify(token, clave);
    } catch (error) {
      return null;
    }
  }
}

export default new TokenService();