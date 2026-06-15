import Vote from '../models/Vote.js';
import User from '../models/User.js';

class VoteService {
  async procesarVotacion({ partidoId, votanteId, votos, salto }) {
    
    // 🛡️ CANDADO BACKEND 1: Evitar doble votación (Anticheat definitivo)
    // Buscamos si este votante ya generó algún voto para este partido en la base de datos
    const yaVotoEnEstePartido = await Vote.exists({ partidoId, votanteId });
    if (yaVotoEnEstePartido) {
      throw new Error('Ya registraste tus valoraciones para este partido. No podés votar dos veces.');
    }

    // CASO A: El usuario decidió saltar la votación y no colaborar
    if (salto) {
      const usuario = await User.findById(votanteId);
      if (!usuario) throw new Error('Usuario votante no encontrado.');
      
      usuario.penalizarPorNoVotar(); // Llama a tu método: honor -= 2 (secreto)
      await usuario.save();

      // 💡 Guardamos el testigo limpio. Al ser tipoMedalla: 'salto', receptorId ya no es requerido
      await Vote.create({
        partidoId,
        votanteId,
        tipoMedalla: 'salto'
      });

      return { msg: 'Votación procesada correctamente.' }; 
    }

    // CASO B: El usuario envió sus valoraciones (Máximo 2 votos)
    if (!votos || votos.length === 0) {
      throw new Error('Deberías seleccionar al menos una medalla o saltar la votación.');
    }
    if (votos.length > 2) {
      throw new Error('No podés otorgar más de 2 medallas por partido.');
    }

    // 🛡️ CANDADO BACKEND 2: Evitar que asigne la misma medalla a dos personas en el mismo envío
    // Filtramos los tipos de medalla enviados para ver si hay duplicados
    const medallasEnviadas = votos.map(v => v.tipoMedalla);
    const medallasUnicas = new Set(medallasEnviadas);
    if (medallasEnviadas.length !== medallasUnicas.size) {
      throw new Error('No podés repetir el mismo honor. Cada medalla debe ser para un jugador distinto.');
    }

    // Procesamos los votos ya validados
    for (const v of votos) {
      const { receptorId, tipoMedalla } = v;

      // 1. Anticheat básico: No vale auto-votarse
      if (votanteId.toString() === receptorId.toString()) {
        throw new Error('No seas fantasma, no podés votarte a vos mismo.');
      }

      // 2. Guardar el voto físico en la base de datos para la auditoría
      await Vote.create({
        partidoId,
        votanteId,
        receptorId,
        tipoMedalla
      });

      // 3. Buscar al jugador que recibió la medalla y actualizar su perfil
      const jugadorReceptor = await User.findById(receptorId);
      if (jugadorReceptor) {
        jugadorReceptor.recibirMedalla(tipoMedalla); // Suma puntos de rango o honor + recalcula nivel
        await jugadorReceptor.save();
      }
    }

    return { msg: 'Valoraciones processed con éxito. ¡Gracias por sumar a la comunidad!' };
  }
}

export default new VoteService();