import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';
import { variables } from './env.js';

// Función para extraer el token desde las cookies (Flujo Web)
const extraerDeCookie = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['jwt']; // Así se va a llamar nuestra cookie
  }
  return token;
};

const opciones = {
  // Passport va a buscar el token primero en el Header (Bearer) y sino en la cookie
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    extraerDeCookie
  ]),
  secretOrKey: variables.PRIVATE_KEY
};

passport.use(
  new JwtStrategy(opciones, async (jwtPayload, done) => {
    try {
      // El payload contiene el id que metimos al firmar el token
      const usuario = await User.buscarPorId(jwtPayload.id);
      
      if (usuario) {
        return done(null, usuario); // Usuario encontrado, se mete en req.user
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;