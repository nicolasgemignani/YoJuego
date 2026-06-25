import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const posicionesFicticias = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];

const sembrarUsuarios = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('🔌 Conectado a MongoDB para la siembra masiva de usuarios...');

    // 1. Limpiar usuarios de prueba anteriores para no duplicar
    await User.deleteMany({ email: { $regex: '@test.com$' } });
    console.log('🗑️ Usuarios de prueba anteriores eliminados.');

    const usuariosFake = [];

    // 2. Bancos de nombres y apellidos extendidos para 35 usuarios únicos
    const nombresFake = [
      'Juan', 'Pedro', 'Lucas', 'Santiago', 'Mateo', 'Matias', 'Agustin', 'Tomas', 'Nicolas', 'Franco', 
      'Bautista', 'Enzo', 'Lautaro', 'Julian', 'Bruno', 'Facundo', 'Gonzalo', 'Valentin', 'Joaquin', 'Leandro',
      'Marcos', 'Ezequiel', 'Ramiro', 'Martin', 'Diego', 'Axel', 'Alejo', 'Manuel', 'Ignacio', 'Federico',
      'Geronimo', 'Alan', 'Damian', 'Camilo', 'Esteban'
    ];
    
    const apellidosFake = [
      'Perez', 'Rodriguez', 'Gomez', 'Fernandez', 'Lopez', 'Diaz', 'Martinez', 'Alvarez', 'Romero', 'Sosa', 
      'Torres', 'Benitez', 'Acosta', 'Silva', 'Russo', 'Ferrari', 'Dominguez', 'Castro', 'Quiroga', 'Medina',
      'Murillo', 'Gimenez', 'Velasquez', 'Suarez', 'Blanco', 'Ortega', 'Morales', 'Ramos', 'Herrera', 'Flores',
      'Peralta', 'Mendoza', 'Ibarra', 'Caceres', 'Sánchez'
    ];

    // 3. Generar los 35 usuarios estructurados
    for (let i = 1; i <= 35; i++) {
      const posicionAleatoria = posicionesFicticias[i % posicionesFicticias.length];
      const nivelAleatorio = Math.floor(Math.random() * (8 - 4 + 1)) + 4; 
      
      let rangoFicticio = 'Bronce';
      let honorFicticio = 50; 

      if (i > 15 && i <= 28) { 
        rangoFicticio = 'Plata'; 
        honorFicticio = 95; 
      } else if (i > 28) { 
        rangoFicticio = 'Oro'; 
        honorFicticio = 160; 
      }

      const nombreDinamico = nombresFake[i - 1] || `Jugador${i}`;
      const apellidoDinamico = apellidosFake[i - 1] || 'DePrueba';

      usuariosFake.push({
        nombre: nombreDinamico,
        apellido: apellidoDinamico,
        email: `jugador${i}@test.com`,
        password: 'password123',
        posicion: posicionAleatoria,
        nivel: nivelAleatorio,
        honor: honorFicticio,
        rango: rangoFicticio
      });
    }

    console.log('⏳ Encriptando contraseñas e insertando 35 usuarios...');
    for (const u of usuariosFake) {
      const nuevoUsuario = new User(u);
      await nuevoUsuario.save(); // Dispara el middleware pre-save para encriptar con bcrypt
    }

    console.log('🚀 ¡Se crearon 35 usuarios de prueba exitosamente!');
    console.log('📝 Credenciales: jugador1@test.com hasta jugador35@test.com | Contraseña: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sembrando los usuarios:', error);
    process.exit(1);
  }
};

sembrarUsuarios();