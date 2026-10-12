// ============================================================
// juanperro - js/paginas/index.js  (logica de la pagina de Juan)
// ============================================================
(function () {
  'use strict';

  var CLAVE_NOMBRE = 'juanperro_cuidador';
  var refresco = null;

  var ETIQUETA_ACCION = {
    alimentar: 'Comida',
    jugar: 'Juego',
    pasear: 'Paseo',
    acariciar: 'Mimos',
    banar: 'Baño'
  };

  var CHIP_ANIMO = {
    tranquilo: 'TRANQUILO',
    feliz: 'FELIZ',
    hambriento: 'CON HAMBRE',
    cansado: 'DORMIDO',
    triste: 'TRISTE',
    sucio: 'SUCIO'
  };

  var MEDIDORES = [
    { stat: 'hambre', barra: 'barraHambre', valor: 'valorHambre' },
    { stat: 'energia', barra: 'barraEnergia', valor: 'valorEnergia' },
    { stat: 'felicidad', barra: 'barraFelicidad', valor: 'valorFelicidad' },
    { stat: 'limpieza', barra: 'barraLimpieza', valor: 'valorLimpieza' }
  ];

  function nombreGuardado() {
    try { return localStorage.getItem(CLAVE_NOMBRE) || ''; } catch (e) { return ''; }
  }

  function guardarNombre(n) {
    try { localStorage.setItem(CLAVE_NOMBRE, n); } catch (e) { /* modo privado */ }
  }

  function aviso(texto, tipo) {
    var a = document.getElementById('aviso');
    if (!a) return;
    a.classList.remove('aviso--ok', 'aviso--error');
    if (tipo) a.classList.add('aviso--' + tipo);
    a.textContent = texto;
  }

  function pintarMedidores(juan) {
    MEDIDORES.forEach(function (m) {
      var v = juan[m.stat];
      var cont = document.querySelector('.medidor[data-stat="' + m.stat + '"]');
      var barra = document.getElementById(m.barra);
      if (barra) barra.style.width = Math.max(0, Math.min(100, v)) + '%';
      UI.texto(m.valor, v + '%');
      if (cont) {
        if (v <= 25) cont.classList.add('medidor--alerta');
        else cont.classList.remove('medidor--alerta');
      }
    });
  }

  function pintarRanking(lista) {
    var ol = document.getElementById('ranking');
    if (!ol) return;
    UI.vaciar(ol);
    if (!lista || !lista.length) {
      ol.appendChild(UI.crear('li', 'ranking-vacio', 'Todavía nadie cuidó a Juan. Sé el primero.'));
      return;
    }
    lista.forEach(function (fila, i) {
      var li = UI.crear('li', 'ranking-item' + (i === 0 ? ' ranking-item--top1' : ''));
      li.appendChild(UI.crear('span', 'ranking-puesto', (i + 1)));
      li.appendChild(UI.crear('span', 'ranking-cuidador', fila.cuidador));
      li.appendChild(UI.crear('span', 'ranking-cant', fila.cuidados + (fila.cuidados === 1 ? ' cuidado' : ' cuidados')));
      ol.appendChild(li);
    });
  }

  function pintarHistorial(lista) {
    var ul = document.getElementById('historial');
    if (!ul) return;
    UI.vaciar(ul);
    if (!lista || !lista.length) {
      ul.appendChild(UI.crear('li', 'historial-vacio', 'Sin cuidados registrados todavía.'));
      return;
    }
    lista.forEach(function (h) {
      var li = UI.crear('li', 'historial-item');
      var izq = UI.crear('span', 'historial-txt', (ETIQUETA_ACCION[h.accion] || h.accion) + ' · ' + h.cuidador);
      li.appendChild(izq);
      li.appendChild(UI.crear('span', 'historial-hora', UI.hace(h.fecha)));
      ul.appendChild(li);
    });
  }

  function pintarTodo(data) {
    if (!data || !data.ok) return;
    var juan = data.juan;
    JuanPerro.mostrar(juan);
    pintarMedidores(juan);
    pintarRanking(data.ranking);
    pintarHistorial(data.historial);
    UI.texto('chipNivel', 'NIVEL ' + juan.nivel);
    UI.texto('chipAnimo', CHIP_ANIMO[juan.animo] || String(juan.animo).toUpperCase());
    if (juan.ultimaAccion) UI.texto('pieMeta', 'Último cuidado: ' + juan.ultimaAccion + ' · ' + data.totalCuidados + ' cuidados en total · ' + JuanAPI.base());
    else UI.texto('pieMeta', data.totalCuidados + ' cuidados en total · ' + JuanAPI.base());
  }

  function cargar(silencioso) {
    return JuanAPI.estado().then(function (data) {
      pintarTodo(data);
      if (!silencioso) aviso('Juan te está mirando. Elegí qué hacer.', 'ok');
    }).catch(function (err) {
      aviso('No se pudo conectar con el servidor de Juan (' + err.message + ').', 'error');
    });
  }

  function cuidar(nombreAccion, boton) {
    var cuidador = (document.getElementById('inputCuidador').value || '').trim();
    if (cuidador) guardarNombre(cuidador);
    var botones = UI.qsa('.accion');
    botones.forEach(function (b) { b.disabled = true; });
    if (boton) boton.disabled = true;

    JuanAPI.cuidar(nombreAccion, cuidador).then(function (data) {
      JuanPerro.accion(nombreAccion);
      JuanPerro.flotante('+' + (ETIQUETA_ACCION[nombreAccion] || nombreAccion));
      pintarTodo(data);
      JuanPerro.decir(data.label + (cuidador ? ', ' + cuidador : '') + '!');
      aviso('¡Listo! ' + data.label + '.', 'ok');
    }).catch(function (err) {
      aviso('No se pudo cuidar a Juan (' + err.message + ').', 'error');
    }).then(function () {
      botones.forEach(function (b) { b.disabled = false; });
    });
  }

  function enganchar() {
    UI.qsa('.accion').forEach(function (b) {
      b.addEventListener('click', function () {
        cuidar(b.getAttribute('data-accion'), b);
      });
    });

    var input = document.getElementById('inputCuidador');
    input.value = nombreGuardado();
    if (input.value) aviso('Vas a figurar como «' + input.value + '» en el ranking.', 'ok');

    document.getElementById('btnGuardarCuidador').addEventListener('click', function () {
      var n = (input.value || '').trim();
      if (!n) {
        guardarNombre('');
        aviso('Sin nombre quedás como «Anónimo» en el ranking.');
        return;
      }
      guardarNombre(n);
      aviso('Listo, ' + n + ': ya firmás tus cuidados.', 'ok');
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btnGuardarCuidador').click();
    });
  }

  function iniciar() {
    enganchar();
    cargar(false);
    refresco = setInterval(function () { cargar(true); }, 30000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) cargar(true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
