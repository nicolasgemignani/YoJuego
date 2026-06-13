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
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('🔌 Conectado a MongoDB para la siembra de partidos...');

    // 1. Limpiar partidos viejos
    await Match.deleteMany({});
    console.log('🗑️ Colección de partidos limpiada.');

    // 2. Traer TODOS los usuarios de prueba (los jugadorX@test.com)
    const todosLosUsuarios = await User.find({ email: { $regex: '@test.com$' } });
    
    if (todosLosUsuarios.length === 0) {
      console.error('❌ ERROR: No hay usuarios de prueba en la base de datos.');
      console.error('👉 Por favor, corre primero: npm run seed:users');
      process.exit(1);
    }

    // Usamos al primer jugador de la lista como el creador de los partidos
    const usuarioCreador = todosLosUsuarios[0];
    const partidosFake = [];

    // 3. Generar los 10 partidos base
    for (let i = 0; i < 10; i++) {
      const fechaPartido = new Date();
      fechaPartido.setDate(fechaPartido.getDate() + (i % 4)); 

      partidosFake.push({
        fecha: fechaPartido,
        hora: horas[i],
        lugar: complejos[i],
        tipoCancha: tiposCancha[i],
        creador: usuarioCreador._id,
        jugadores: [],
        suplentes: [],
        estado: 'abierto'
      });
    }

    // 4. Guardar los partidos en la base de datos
    const partidosCreados = await Match.insertMany(partidosFake);
    console.log('🚀 Se crearon los 10 partidos vacíos.');

    // 5. 🔥 LA MAGIA: Agarrar el PRIMER partido (Fútbol 5 -> cupo 10) y llenarlo
    const primerPartido = await Match.findById(partidosCreados[0]._id);
    
    console.log(`⏳ Simulando inscripción automática de 15 jugadores en: ${primerPartido.lugar}...`);
    
    // Recorremos los 15 usuarios generados y los anotamos usando el método del modelo
    for (const usuario of todosLosUsuarios) {
      // LLamamos al método de instancia que programamos en el Modelo Match
      primerPartido.anotarJugador(usuario._id);
    }

    // Guardamos el partido con las listas de titulares y suplentes ya procesadas por el flujo FIFO
    await primerPartido.save();

    console.log('✅ ¡Partido estrella configurado con éxito!');
    console.log(`   • Titulares anotados: ${primerPartido.jugadores.length}/${primerPartido.cupoMaximo}`);
    console.log(`   • Suplentes en cola de espera (FIFO): ${primerPartido.suplentes.length}`);
    console.log(`   • Estado del partido: '${primerPartido.estado}'`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sembrando la base de datos:', error);
    process.exit(1);
  }
};

sembrarPartidos();