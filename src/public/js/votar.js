document.addEventListener('DOMContentLoaded', () => {
  const votosGuardados = new Map(); // Estructura: jugadorId -> tipoMedalla
  let jugadorSeleccionadoId = null;

  // Inicializar Modal de Bootstrap
  const modalElement = document.getElementById('modalMedalla');
  const modalMedalla = new bootstrap.Modal(modalElement);
  const btnEnviar = document.getElementById('btnEnviar');
  const countVotosText = document.getElementById('countVotos');

  // Solución al error de Accesibilidad/Foco de Bootstrap al cerrar el modal
  modalElement.addEventListener('hidden.bs.modal', () => {
    // Le quitamos el foco al botón que haya quedado adentro del modal para que no chille la consola
    if (document.activeElement) {
      document.activeElement.blur();
    }
  });

  // 1. Clic en una Carta de Jugador
  document.querySelectorAll('.fifa-card').forEach(card => {
    card.addEventListener('click', () => {
      jugadorSeleccionadoId = card.getAttribute('data-id');
      
      // 🛡️ Si ya hay 2 votos y esta carta NO está seleccionada, bloqueamos el click
      if (votosGuardados.size >= 2 && !votosGuardados.has(jugadorSeleccionadoId)) {
        return; 
      }

      const nombre = card.getAttribute('data-nombre');
      document.getElementById('modalJugadorNombre').innerText = nombre;

      // Recolectar medallas ocupadas por otros pibes
      const medallasOcupadas = [];
      votosGuardados.forEach((tipoMedalla, id) => {
        if (id !== jugadorSeleccionadoId) {
          medallasOcupadas.push(tipoMedalla);
        }
      });

      // Controlar el estado de cada botón de medalla en el modal
      document.querySelectorAll('.btn-medalla').forEach(btn => {
        const tipoMedalla = btn.getAttribute('data-tipo');

        // 💡 LIMPIEZA CRÍTICA: Sacamos TODAS las clases de color para que no se mezclen
        btn.classList.remove('opacity-50', 'btn-secondary', 'btn-outline-primary', 'btn-outline-warning', 'btn-outline-success');

        if (medallasOcupadas.includes(tipoMedalla)) {
          // Si ya se usó, se congela gris
          btn.disabled = true;
          btn.classList.add('opacity-50', 'btn-secondary');
        } else {
          // Si está libre, se habilita y le devolvemos SU color correspondiente
          btn.disabled = false;
          if (tipoMedalla === 'jugadorPartido') {
            btn.classList.add('btn-outline-primary');
          } else if (tipoMedalla === 'actitudEsfuerzo') {
            btn.classList.add('btn-outline-warning');
          } else if (tipoMedalla === 'buenCompanero') {
            btn.classList.add('btn-outline-success');
          }
        }
      });

      // Si ya tenía un voto, mostrar botón quitar
      document.getElementById('btnQuitarVoto').style.display = votosGuardados.has(jugadorSeleccionadoId) ? 'block' : 'none';

      modalMedalla.show();
    });
  });

    // 2. Clic en un botón de Medalla dentro del Modal
    document.querySelectorAll('.btn-medalla').forEach(btn => {
        btn.addEventListener('click', () => {
        // 💡 SOLUCIÓN: Le quitamos el foco al botón cliqueado ANTES de ocultar el modal
        if (document.activeElement) {
            document.activeElement.blur();
        }

        const tipoMedalla = btn.getAttribute('data-tipo');

        // Guardar el voto
        votosGuardados.set(jugadorSeleccionadoId, tipoMedalla);
        
        const tarjetaHtml = document.querySelector(`.fifa-card[data-id="${jugadorSeleccionadoId}"]`);
        if (tarjetaHtml) tarjetaHtml.classList.add('selected');

        modalMedalla.hide();
        actualizarBotones();
        });
    });

    // 3. Clic en Quitar Medalla
    document.getElementById('btnQuitarVoto').addEventListener('click', () => {
        // 💡 SOLUCIÓN: Quitamos el foco también acá antes de cerrar
        if (document.activeElement) {
        document.activeElement.blur();
        }

        votosGuardados.delete(jugadorSeleccionadoId);
        const tarjetaHtml = document.querySelector(`.fifa-card[data-id="${jugadorSeleccionadoId}"]`);
        if (tarjetaHtml) tarjetaHtml.classList.remove('selected');
        
        modalMedalla.hide();
        actualizarBotones();
    });

  // 🔄 FUNCIÓN ACTUALIZAR BOTONES CON FILTROS INYECTADOS DIRECTO AL DOM
  // 🔄 FUNCIÓN ACTUALIZAR BOTONES REPARADA
    function actualizarBotones() {
    const cantidad = votosGuardados.size;
    countVotosText.innerText = cantidad;
    
    btnEnviar.disabled = cantidad === 0;

    // 🛡️ LÓGICA DE CONGELAR CARTAS NO SELECCIONADAS
    document.querySelectorAll('.fifa-card').forEach(card => {
        const id = card.getAttribute('data-id');

        if (cantidad >= 2) {
        if (!votosGuardados.has(id)) {
            // Inyectamos los filtros directo usando la API de estilos
            card.style.setProperty('filter', 'grayscale(100%) brightness(50%)', 'important');
            card.style.setProperty('opacity', '0.4', 'important');
            card.style.cursor = 'not-allowed';
        } else {
            // 💡 CORRECCIÓN ACÁ: Así se remueven correctamente los estilos en línea
            card.style.filter = '';
            card.style.opacity = '';
            card.style.cursor = 'pointer';
        }
        } else {
        // Si hay menos de 2 votos, limpiamos los estilos de todas las cartas
        card.style.filter = '';
        card.style.opacity = '';
        card.style.cursor = 'pointer';
        }
    });
    }

  // 4. Enviar Valoraciones
  btnEnviar.addEventListener('click', () => {
    const arrayVotos = [];
    votosGuardados.forEach((tipoMedalla, receptorId) => {
      arrayVotos.push({ receptorId, tipoMedalla });
    });

    document.getElementById('inputVotos').value = JSON.stringify(arrayVotos);
    document.getElementById('inputSalto').value = "false";
    document.getElementById('formVotacion').submit();
  });

  // 5. Clic en Saltar Votación
  // Inicializar el nuevo Modal Estético de Confirmación
  const modalSaltoElement = document.getElementById('modalConfirmarSalto');
  const modalConfirmarSalto = new bootstrap.Modal(modalSaltoElement);

  // 5. Clic en Saltar Votación (Abre el modal estético)
  document.getElementById('btnSaltar').addEventListener('click', () => {
    // Le quitamos el foco al botón para mantener la consola limpia
    if (document.activeElement) document.activeElement.blur();
    
    // Mostramos el cartel hermoso de Bootstrap
    modalConfirmarSalto.show();
  });

  // Escuchamos el click adentro del botón de confirmación final del modal
  document.getElementById('btnConfirmarSaltoFinal').addEventListener('click', () => {
    // Cerramos el foco
    if (document.activeElement) document.activeElement.blur();

    // Cargamos los datos ocultos y mandamos el formulario a la guerra
    document.getElementById('inputVotos').value = JSON.stringify([]);
    document.getElementById('inputSalto').value = "true";
    
    modalConfirmarSalto.hide();
    document.getElementById('formVotacion').submit();
  });
});