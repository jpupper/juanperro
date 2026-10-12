// ============================================================
// juanperro - js/juan.js  (como se comporta y "habla" Juan)
// ============================================================
(function () {
  'use strict';

  var SVG_ID = 'juanSvg';
  var ESTADOS = ['tranquilo', 'feliz', 'hambriento', 'cansado', 'triste', 'sucio'];
  var ACCIONES = ['comiendo', 'jugando', 'paseando', 'acariciando', 'baniando'];
  var ANIMO_A_ACCION = {
    alimentar: 'comiendo',
    jugar: 'jugando',
    pasear: 'paseando',
    acariciar: 'acariciando',
    banar: 'baniando'
  };

  var FRASES = {
    tranquilo: ['Guau.', 'Estoy por acá.', '¿Viste que lindo el pasto?', 'Tirate un mimo.'],
    feliz: ['¡Guau guau!', '¡Soy el perro más feliz del ecosistema!', '¡Otra vez!', 'Mové la cola conmigo.'],
    hambriento: ['Tengo hambre…', '¿Eso es comida?', 'Guau (traducido: comida).', 'Se me cae la baba.'],
    cansado: ['Zzz…', 'Cinco minutitos más.', 'Hoy corrí mucho.', 'Modo siesta activado.'],
    triste: ['Estoy bajón.', '¿Nadie me da bola?', 'Guau…', 'Mimitos, por favor.'],
    sucio: ['Me rebozé en el barro.', 'Necesito un baño.', 'Huelo a perro mojado.', 'Fue sin querer.']
  };

  var temporizadorAccion = null;
  var temporizadorBurbuja = null;

  function svg() { return document.getElementById(SVG_ID); }

  function limpiarEstados() {
    var n = svg();
    if (!n) return;
    ESTADOS.forEach(function (e) { n.classList.remove('juan--' + e); });
    ACCIONES.forEach(function (a) { n.classList.remove('juan--accion-' + a); });
  }

  function frasePara(animo, semilla) {
    var lista = FRASES[animo] || FRASES.tranquilo;
    var i = Math.abs(Math.round(semilla || 0)) % lista.length;
    return lista[i];
  }

  function decir(texto) {
    var b = document.getElementById('burbuja');
    if (!b) return;
    b.classList.remove('burbuja--fuera');
    b.textContent = texto;
    if (temporizadorBurbuja) clearTimeout(temporizadorBurbuja);
    temporizadorBurbuja = setTimeout(function () {
      b.classList.add('burbuja--fuera');
    }, 6000);
  }

  // Aplica el estado que devuelve el backend
  function mostrar(juan, decirAlgo) {
    if (!juan) return;
    var n = svg();
    if (!n) return;
    limpiarEstados();
    n.classList.add('juan--' + (juan.animo || 'tranquilo'));
    document.body.setAttribute('data-animo', juan.animo || 'tranquilo');
    if (decirAlgo !== false) decir(frasePara(juan.animo, Date.now() / 1000));
  }

  // Animacion puntual de una accion (no pisa el estado de animo)
  function accion(nombreAccion) {
    var n = svg();
    if (!n) return;
    var clase = ANIMO_A_ACCION[nombreAccion];
    if (!clase) return;
    var anterior = clase;
    if (temporizadorAccion) clearTimeout(temporizadorAccion);
    ACCIONES.forEach(function (a) { n.classList.remove('juan--accion-' + a); });
    // fuerza reflow para reiniciar la animacion
    void n.getBoundingClientRect();
    n.classList.add('juan--accion-' + anterior);
    temporizadorAccion = setTimeout(function () {
      n.classList.remove('juan--accion-' + anterior);
    }, 2000);
  }

  // Globo flotante "+CUIDADO" sobre el perro
  function flotante(texto) {
    var esc = document.querySelector('.escenario');
    if (!esc) return;
    var g = document.createElement('div');
    g.className = 'flotante';
    g.textContent = texto;
    esc.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 1500);
  }

  window.JuanPerro = {
    mostrar: mostrar,
    accion: accion,
    flotante: flotante,
    decir: decir,
    frasePara: frasePara
  };
})();
