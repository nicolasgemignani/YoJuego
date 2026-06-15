import User from '../../models/User.js';
// Importá también tu modelo de Partidos (asumo que se llama Match o Partido)
import Match from '../../models/Match.js'; 
import voteService from '../../services/voteService.js';

// 💡 NUEVO: Renderiza la pantalla con las cartas estilo FIFA
export const mostrarPantallaVotacion = async (req, res) => {
  try {
    const { idPartido } = req.params;
    const usuarioLogueadoId = req.user._id;

    // 1. Buscamos el partido para asegurarnos de que exista y esté finalizado
    const partido = await Match.findById(idPartido).populate('jugadores'); 
    if (!partido) {
      return res.status(404).render('web/error', { error: 'Partido no encontrado.' });
    }

    // 2. Filtramos la lista de jugadores para EXCLUIR al usuario que está votando
    // (Así no se puede auto-votar en la pantalla)
    const compañeros = partido.jugadores.filter(
      (jugador) => jugador._id.toString() !== usuarioLogueadoId.toString()
    );

    // 3. Renderizamos la vista pasándole los datos limpios
    res.render('web/votar', {
      partidoId: partido._id,
      jugadores: compañeros,
      error: req.query.error, // Captura errores si el POST rebota
      success: req.query.success
    });

  } catch (error) {
    res.status(500).render('web/error', { error: error.message });
  }
};

// Esta es la que ya tenías armada antes para procesar el POST
export const guardarValoraciones = async (req, res) => {
  try {
    const { partidoId, votos, salto } = req.body;
    const votanteId = req.user._id;

    // Deserializamos el string JSON que manda el JS del cliente
    const votosParseados = votos ? JSON.parse(votos) : [];

    const resultado = await voteService.procesarVotacion({
      partidoId,
      votanteId,
      votos: votosParseados,
      salto: salto === 'true' || salto === true
    });

    res.redirect('/?success=' + encodeURIComponent(resultado.msg));

  } catch (error) {
    res.redirect(`/web/votos/${req.body.partidoId}/votar?error=` + encodeURIComponent(error.message));
  }
};