import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Array de posiciones para que los usuarios de prueba queden variados y reales
const posicionesFicticias = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];

const sembrarUsuarios = async () => {
  try {
    // 1. Conectar a MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('🔌 Conectado a MongoDB para la siembra de usuarios...');

    // 2. Limpiar usuarios de prueba anteriores para no duplicar
    // Ojo: Esto borra SOLO los usuarios que tengan el formato "@test.com" para no borrar tu cuenta real
    await User.deleteMany({ email: { $regex: '@test.com$' } });
    console.log('🗑️ Usuarios de prueba anteriores eliminados.');

    const usuariosFake = [];

    // 3. Generar los 15 usuarios estructurados
    // Listas para inventar nombres variados en el seed
    const nombresFake = ['Juan', 'Pedro', 'Lucas', 'Santiago', 'Mateo', 'Matias', 'Agustin', 'Tomas', 'Nicolas', 'Franco', 'Bautista', 'Enzo', 'Lautaro', 'Julian', 'Bruno'];
    const apellidosFake = ['Perez', 'Rodriguez', 'Gomez', 'Fernandez', 'Lopez', 'Diaz', 'Martinez', 'Alvarez', 'Romero', 'Sosa', 'Torres', 'Benitez', 'Acosta', 'Silva', 'Russo'];

    // 3. Generar los 15 usuarios estructurados
    for (let i = 1; i <= 15; i++) {
      const posicionAleatoria = posicionesFicticias[i % posicionesFicticias.length];
      const nivelAleatorio = Math.floor(Math.random() * (8 - 4 + 1)) + 4; 
      
      let rangoFicticio = 'Bronce';
      let honorFicticio = 50; 

      if (i > 10) { 
        rangoFicticio = 'Plata'; 
        honorFicticio = 95; 
      }
      if (i === 15) { 
        rangoFicticio = 'Oro'; 
        honorFicticio = 160; 
      }

      // Tomamos un nombre y apellido de la lista usando el índice
      const nombreDinamico = nombresFake[i - 1] || 'Jugador';
      const apellidoDinamico = apellidosFake[i - 1] || 'DePrueba';

      usuariosFake.push({
        nombre: nombreDinamico,     // 👈 NUEVO: Nombre obligatorio
        apellido: apellidoDinamico, // 👈 NUEVO: Apellido obligatorio
        email: `jugador${i}@test.com`,
        password: 'password123',
        posicion: posicionAleatoria,
        nivel: nivelAleatorio,
        honor: honorFicticio,
        rango: rangoFicticio
      });
    }

    // 4. Insertar los usuarios uno por uno o en lote. 
    // Usamos un bucle con .save() o un mapeo manual para asegurar que se dispare el middleware 'pre-save' de bcrypt en cada uno.
    console.log('⏳ Encriptando contraseñas e insertando usuarios...');
    for (const u of usuariosFake) {
      const nuevoUsuario = new User(u);
      await nuevoUsuario.save();
    }

    console.log('🚀 ¡Se crearon 15 usuarios de prueba exitosamente!');
    console.log('📝 Credenciales comunes: jugador1@test.com hasta jugador15@test.com | Contraseña: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sembrando los usuarios:', error);
    process.exit(1);
  }
};

sembrarUsuarios();