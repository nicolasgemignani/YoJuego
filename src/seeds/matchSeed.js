import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Match from '../models/Match.js';

dotenv.config();

const complejos = [
  'Salguero Fútbol (Palermo)',
  'Club de la Cancha (Colegiales)',
  'La Estación (Belgrano)',
  'Open Gallo (Abasto)',
  'Complejo El Diego (San Telmo)',
  'Fútbol Madero (Puerto Madero)',
  'Viejo Bueno (Caballito)',
  'Campito Fútbol (Urquiza)',
  'La Terraza (Chacarita)',
  'Doble Cinco (Nuñez)'
];

const horas = ['18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
const tiposCancha = [5, 7, 11, 5, 5, 7, 5, 11, 5, 7];

const sembrarPartidos = async () => {
  try {
    // 1. Conectar a MongoDB Atlas usando tu variable de entorno
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('🔌 Conectado a MongoDB para la siembra...');

    // 2. Limpiar partidos viejos para no duplicar cada vez que corras el script
    await Match.deleteMany({});
    console.log('🗑️ Colección de partidos limpiada.');

    // 3. Buscar un usuario real para asignarlo como creador obligatorio
    const usuarioCreador = await User.findOne();
    if (!usuarioCreador) {
      console.error('❌ ERROR: No hay usuarios en la base de datos. Registrate con al menos un usuario por la web antes de correr el seed.');
      process.exit(1);
    }

    const partidosFake = [];

    // 4. Generar los 10 partidos dinámicamente
    for (let i = 0; i < 10; i++) {
      // Generamos fechas escalonadas (hoy, mañana, pasado...)
      const fechaPartido = new Date();
      fechaPartido.setDate(fechaPartido.getDate() + (i % 4)); 

      partidosFake.push({
        fecha: fechaPartido,
        hora: horas[i],
        lugar: complejos[i],
        tipoCancha: tiposCancha[i],
        creador: usuarioCreador._id,
        jugadores: [], // Arrancan vacíos para que pruebes el botón de unión
        estado: 'abierto'
      });
    }

    // 5. Impactar en Atlas
    await Match.insertMany(partidosFake);
    console.log('🚀 ¡Se sembraron 10 partidos con éxito en tu base de datos!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sembrando la base de datos:', error);
    process.exit(1);
  }
};

sembrarPartidos();