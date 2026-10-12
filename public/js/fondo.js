// ============================================================
// juanperro - js/fondo.js  (fondo animado: huellas que cruzan la pantalla)
// Canvas 2D, sin dependencias. Respeta prefers-reduced-motion.
// ============================================================
(function () {
  'use strict';

  var canvas = document.getElementById('fondoCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var huellas = [];
  var CANTIDAD = 26;

  function medir() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function nuevaHuella(inicial) {
    var roja = Math.random() < 0.14;
    return {
      x: Math.random() * W,
      y: inicial ? Math.random() * H : H + 40,
      esc: 0.5 + Math.random() * 0.9,
      vel: 0.18 + Math.random() * 0.5,
      giro: (Math.random() - 0.5) * 0.5,
      alfa: roja ? 0.16 : 0.055 + Math.random() * 0.05,
      color: roja ? '#ff0000' : '#ffffff'
    };
  }

  function huella(x, y, esc, giro, color, alfa) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    ctx.scale(esc, esc);
    ctx.globalAlpha = alfa;
    ctx.fillStyle = color;
    // almohadilla
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // dedos
    var dedos = [[-11, -10, 4], [-4, -14, 4], [4, -14, 4], [11, -10, 4]];
    for (var i = 0; i < dedos.length; i++) {
      ctx.beginPath();
      ctx.ellipse(dedos[i][0], dedos[i][1], dedos[i][2], dedos[i][2] * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function pintar() {
    ctx.clearRect(0, 0, W, H);
    // gradiente de base
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(12,12,12,1)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < huellas.length; i++) {
      var h = huellas[i];
      huella(h.x, h.y, h.esc, h.giro, h.color, h.alfa);
    }
  }

  function paso() {
    for (var i = 0; i < huellas.length; i++) {
      var h = huellas[i];
      h.y -= h.vel;
      h.x += Math.sin((Date.now() / 4200) + i) * 0.25;
      if (h.y < -50) huellas[i] = nuevaHuella(false);
    }
    pintar();
    if (!reducido) requestAnimationFrame(paso);
  }

  medir();
  for (var i = 0; i < CANTIDAD; i++) huellas.push(nuevaHuella(true));
  pintar();
  if (!reducido) requestAnimationFrame(paso);

  var t = null;
  window.addEventListener('resize', function () {
    if (t) clearTimeout(t);
    t = setTimeout(function () {
      medir();
      huellas = [];
      for (var j = 0; j < CANTIDAD; j++) huellas.push(nuevaHuella(true));
      pintar();
    }, 180);
  });
})();
