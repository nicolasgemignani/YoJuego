import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Vote from '../models/Vote.js'; // 💡 Importamos votos para limpiar también

dotenv.config();

const complejos = [
  'Salguero Fútbol (Palermo)',       // [0] Full titulares + Full suplentes (Fútbol 5 -> 10 + 5 = 15)
  'Club de la Cancha (Colegiales)',  // [1] Full titulares + Full suplentes (Fútbol 7 -> 14 + 7 = 21)
  'La Estación (Belgrano)',          // [2] Full titulares, 0 suplentes (Fútbol 11 -> 22)
  'Open Gallo (Abasto)',             // [3] Full titulares, 0 suplentes (Fútbol 5 -> 10)
  'Complejo El Diego (San Telmo)',   // [4] Falta 1 titular (Fútbol 5 -> necesita 9)
  'Fútbol Madero (Puerto Madero)',   // [5] Falta 1 titular (Fútbol 7 -> necesita 13)
  'Viejo Bueno (Caballito)',         // [6] Falta 1 suplente para llenar espera (Fútbol 5 -> 10 + 4 = 14)
  'Campito Fútbol (Urquiza)',        // [7] Falta 1 suplente para llenar espera (Fútbol 11 -> 22 + 10 = 32)
  'La Terraza (Chacarita)',          // [8] Vacío / Disponible
  'Doble Cinco (Nuñez)'              // [9] Vacío / Disponible
];

const horas = ['18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
const tiposCancha = [5, 7, 11, 5, 5, 7, 5, 11, 5, 7];

const sembrarPartidos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('🔌 Conectado a MongoDB para la siembra de partidos...');

    // 1. Limpiar partidos y votos viejos
    await Match.deleteMany({});
    await Vote.deleteMany({}); // 💡 Adiós a los votos viejos para evitar conflictos de IDs
    console.log('🗑️ Colecciones de partidos y votos limpiadas por completo.');

    // 2. Traer TODOS los usuarios de prueba
    const todosLosUsuarios = await User.find({ email: { $regex: '@test.com$' } });
    
    if (todosLosUsuarios.length < 35) {
      console.error(`❌ ERROR: Se encontraron solo ${todosLosUsuarios.length} usuarios.`);
      console.error('👉 Por favor, corre primero tu nuevo seed de usuarios: npm run seed:users');
      process.exit(1);
    }

    const usuarioCreador = todosLosUsuarios[0];
    const partidosFake = [];

    // 3. Generar los 10 partidos base
    for (let i = 0; i < 10; i++) {
      const fechaPartido = new Date();
      fechaPartido.setDate(fechaPartido.getDate() + (i % 4) + 1); // Asegura que sean fechas futuras

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
    console.log('🚀 Se crearon los 10 partidos vacíos de base.');

    console.log('⏳ Iniciando simulación de inscripciones variadas...');

    // 5. Lógica de llenado utilizando los 35 usuarios disponibles
    for (let i = 0; i < partidosCreados.length; i++) {
      const partidoId = partidosCreados[i]._id;
      const partidoActual = await Match.findById(partidoId);
      
      const maxTitulares = partidoActual.tipoCancha * 2;
      const maxSuplentes = partidoActual.tipoCancha;

      let limiteInscripciones = 0;

      switch(i) {
        case 0:
        case 1:
          limiteInscripciones = maxTitulares + maxSuplentes;
          break;
        case 2:
        case 3:
          limiteInscripciones = maxTitulares;
          break;
        case 4:
        case 5:
          limiteInscripciones = maxTitulares - 1;
          break;
        case 6:
        case 7:
          limiteInscripciones = maxTitulares + (maxSuplentes - 1);
          break;
        default:
          limiteInscripciones = 0;
          break;
      }

      // Inscribimos a los pibes de forma lineal usando el banco de 35 usuarios
      if (limiteInscripciones > 0) {
        for (let j = 0; j < limiteInscripciones; j++) {
          const usuario = todosLosUsuarios[j % todosLosUsuarios.length];
          
          try {
            partidoActual.anotarJugador(usuario._id);
          } catch (e) {
            // Manejo silencioso por si se intenta duplicar en el mismo partido
          }
        }
        await partidoActual.save();
      }
    }

    // 6. Reporte final detallado
    console.log('\n============== RESUMEN DE COMPROBACIÓN ==============');
    const partidosVerificados = await Match.find({});
    partidosVerificados.forEach((p, idx) => {
      console.log(`[Partido ${idx}] Cancha de ${p.tipoCancha} - ${p.lugar}`);
      console.log(`   • Titulares: ${p.jugadores.length}/${p.cupoMaximo}`);
      console.log(`   • Suplentes en espera: ${p.suplentes.length}/${p.tipoCancha}`);
      console.log(`   • Estado final: '${p.estado}'\n`);
    });

    console.log('✅ ¡Ejecución del seed finalizada con éxito con todos los escenarios!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sembrando la base de datos:', error);
    process.exit(1);
  }
};

sembrarPartidos();