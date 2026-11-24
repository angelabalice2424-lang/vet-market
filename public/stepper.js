// Formulario de reserva por pasos. Si JavaScript está apagado, todos los pasos
// quedan visibles y el formulario funciona igual (mejora progresiva).
(function () {
  var form = document.getElementById('reserva');
  if (!form) return;

  var pasos = Array.prototype.slice.call(form.querySelectorAll('.paso'));
  if (pasos.length === 0) return;

  var anterior = document.getElementById('anterior');
  var siguiente = document.getElementById('siguiente');
  var confirmar = document.getElementById('confirmar');
  var barra = document.getElementById('barra');
  var etiqueta = document.getElementById('etiqueta-paso');
  var horaElegida = document.getElementById('hora-elegida');
  var actual = 0;

  // Desactivamos la validación nativa: el navegador no puede mostrar errores de campos ocultos.
  // Validamos a mano, paso por paso, y también el horario.
  form.noValidate = true;

  // Si hay errores del servidor, el paso queda donde estaba el primer dato inválido
  function render() {
    pasos.forEach(function (p, i) { p.hidden = i !== actual; });
    var ultimo = actual === pasos.length - 1;
    anterior.hidden = actual === 0;
    siguiente.hidden = ultimo;
    confirmar.hidden = !ultimo;
    barra.style.width = ((actual + 1) / pasos.length * 100) + '%';
    etiqueta.textContent = 'Paso ' + (actual + 1) + ' de ' + pasos.length + ': ' + pasos[actual].dataset.titulo;
  }

  // Valida solo los campos del paso visible y muestra el primer error
  function validarPaso(indice) {
    var campos = pasos[indice].querySelectorAll('input, select, textarea');
    for (var i = 0; i < campos.length; i++) {
      if (!campos[i].checkValidity()) {
        campos[i].reportValidity();
        campos[i].focus();
        return false;
      }
    }
    return true;
  }

  siguiente.addEventListener('click', function () {
    if (validarPaso(actual)) {
      actual = Math.min(actual + 1, pasos.length - 1);
      render();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  anterior.addEventListener('click', function () {
    actual = Math.max(actual - 1, 0);
    render();
  });

  // Al confirmar, si algún paso tiene datos inválidos, saltamos a ese paso
  form.addEventListener('submit', function (e) {
    var horario = form.querySelector('input[name="time"]:checked');
    if (!horario) {
      e.preventDefault();
      form.querySelector('.slots').scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (horaElegida) horaElegida.textContent = 'elegí un horario primero';
      return;
    }
    for (var i = 0; i < pasos.length; i++) {
      var campos = pasos[i].querySelectorAll('input, select, textarea');
      for (var j = 0; j < campos.length; j++) {
        if (!campos[j].checkValidity()) {
          e.preventDefault();
          actual = i;
          render();
          validarPaso(i);
          return;
        }
      }
    }
  });

  // Mostrar la hora elegida en el resumen
  form.querySelectorAll('input[name="time"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (horaElegida) horaElegida.textContent = radio.value + ' hs';
    });
    if (radio.checked && horaElegida) horaElegida.textContent = radio.value + ' hs';
  });

  render();
})();
