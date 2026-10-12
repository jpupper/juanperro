// ============================================================
// juanperro - estado de JUAN (un solo perro, compartido por todos)
// Mongo si esta disponible; si no, memoria (arranque resiliente).
// ============================================================
const mongoose = require('mongoose');

// --- Modelos -------------------------------------------------
const JuanSchema = new mongoose.Schema({
  clave: { type: String, default: 'juan', unique: true },
  hambre: { type: Number, default: 55 },      // 100 = lleno
  energia: { type: Number, default: 80 },     // 100 = descansado
  felicidad: { type: Number, default: 60 },   // 100 = chocho
  limpieza: { type: Number, default: 70 },    // 100 = limpio
  xp: { type: Number, default: 0 },
  acciones: {
    alimentar: { type: Number, default: 0 },
    jugar: { type: Number, default: 0 },
    pasear: { type: Number, default: 0 },
    acariciar: { type: Number, default: 0 },
    banar: { type: Number, default: 0 }
  },
  ultimaAccion: { type: String, default: null },
  actualizado: { type: Date, default: Date.now }
}, { collection: 'juan_estado' });

const CuidadoSchema = new mongoose.Schema({
  cuidador: { type: String, required: true },
  accion: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
}, { collection: 'juan_cuidados' });

const Juan = mongoose.model('Juan', JuanSchema);
const Cuidado = mongoose.model('Cuidado', CuidadoSchema);

// --- Estado en memoria (fallback) ----------------------------
const memoria = {
  juan: {
    clave: 'juan',
    hambre: 55, energia: 80, felicidad: 60, limpieza: 70, xp: 0,
    acciones: { alimentar: 0, jugar: 0, pasear: 0, acariciar: 0, banar: 0 },
    ultimaAccion: null,
    actualizado: new Date()
  },
  cuidados: []
};

let conectado = false;

function estadoConexion() {
  return { conectado: conectado, uri: conectado ? 'mongo' : 'memoria' };
}

async function iniciar(uri, NODE_ENV) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 20000,
      minPoolSize: 0,
      maxIdleTimeMS: 60000
    });
    conectado = true;
    console.log('Mongo conectado ->', uri);
  } catch (err) {
    conectado = false;
    console.error('Mongo no disponible (' + err.message + '). Uso estado en MEMORIA.');
    if (NODE_ENV === 'production') {
      console.error('ATENCION: en produccion sin Mongo los cuidados no se persisten.');
    }
  }
  return conectado;
}

// --- Decaimiento por tiempo ----------------------------------
// Juan se va poniendo hambriento / aburrido / sucio mientras nadie lo cuida.
const DECAIMIENTO = { hambre: 9, energia: 5, felicidad: 6, limpieza: 3 }; // puntos por hora

function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

function decaer(juan, ahora) {
  const horas = Math.max(0, (ahora - new Date(juan.actualizado).getTime()) / 3600000);
  if (horas <= 0) return juan;
  juan.hambre = clamp(juan.hambre - DECAIMIENTO.hambre * horas);
  juan.energia = clamp(juan.energia - DECAIMIENTO.energia * horas);
  juan.felicidad = clamp(juan.felicidad - DECAIMIENTO.felicidad * horas);
  juan.limpieza = clamp(juan.limpieza - DECAIMIENTO.limpieza * horas);
  return juan;
}

// --- Efectos de cada accion ----------------------------------
const ACCIONES = {
  alimentar: { label: 'Le diste de comer', efecto: { hambre: +32, felicidad: +6, limpieza: -6 } },
  jugar:     { label: 'Jugaste con Juan',  efecto: { felicidad: +22, energia: -14, hambre: -10, limpieza: -8 } },
  pasear:    { label: 'Los dos a la vuelta', efecto: { felicidad: +15, energia: -9, hambre: -14, limpieza: -14 } },
  acariciar: { label: 'Le hiciste mimos',  efecto: { felicidad: +12, energia: +2 } },
  banar:     { label: 'Bano de espuma',    efecto: { limpieza: +40, felicidad: -6, energia: -4 } }
};

function nivelDe(xp) { return 1 + Math.floor((xp || 0) / 10); }

function animo(juan) {
  if (juan.hambre <= 25) return 'hambriento';
  if (juan.energia <= 25) return 'cansado';
  if (juan.felicidad <= 25) return 'triste';
  if (juan.limpieza <= 25) return 'sucio';
  if (juan.felicidad >= 80) return 'feliz';
  return 'tranquilo';
}

function serializar(juan) {
  return {
    nombre: 'Juan',
    hambre: juan.hambre,
    energia: juan.energia,
    felicidad: juan.felicidad,
    limpieza: juan.limpieza,
    xp: juan.xp || 0,
    nivel: nivelDe(juan.xp),
    animo: animo(juan),
    acciones: juan.acciones,
    ultimaAccion: juan.ultimaAccion,
    actualizado: juan.actualizado
  };
}

// --- Lectura -------------------------------------------------
async function leerJuan() {
  const ahora = new Date();
  let juan;
  if (conectado) {
    juan = await Juan.findOne({ clave: 'juan' });
    if (!juan) juan = await Juan.create({ clave: 'juan' });
    decaer(juan, ahora);
    juan.actualizado = ahora;
    await juan.save();
    return juan.toObject();
  }
  decaer(memoria.juan, ahora);
  memoria.juan.actualizado = ahora;
  return memoria.juan;
}

async function ranking(limite) {
  limite = limite || 8;
  if (conectado) {
    const filas = await Cuidado.aggregate([
      { $group: { _id: '$cuidador', cuidados: { $sum: 1 }, ultima: { $max: '$fecha' } } },
      { $sort: { cuidados: -1, ultima: 1 } },
      { $limit: limite }
    ]);
    return filas.map((f) => ({ cuidador: f._id, cuidados: f.cuidados, ultima: f.ultima }));
  }
  const mapa = {};
  memoria.cuidados.forEach((c) => {
    const k = c.cuidador;
    if (!mapa[k]) mapa[k] = { cuidador: k, cuidados: 0, ultima: c.fecha };
    mapa[k].cuidados++;
    if (c.fecha > mapa[k].ultima) mapa[k].ultima = c.fecha;
  });
  return Object.values(mapa)
    .sort((a, b) => b.cuidados - a.cuidados || new Date(a.ultima) - new Date(b.ultima))
    .slice(0, limite);
}

async function historial(limite) {
  limite = limite || 12;
  if (conectado) {
    const filas = await Cuidado.find().sort({ fecha: -1 }).limit(limite).lean();
    return filas.map((f) => ({ cuidador: f.cuidador, accion: f.accion, fecha: f.fecha }));
  }
  return memoria.cuidados.slice(-limite).reverse();
}

async function totalCuidados() {
  if (conectado) return Cuidado.estimatedDocumentCount();
  return memoria.cuidados.length;
}

// --- Escritura ----------------------------------------------
async function cuidar(accion, cuidador) {
  const def = ACCIONES[accion];
  if (!def) return { ok: false, error: 'accion_desconocida' };

  const ahora = new Date();
  let juan = await leerJuan();
  const efecto = def.efecto;
  juan.hambre = clamp(juan.hambre + (efecto.hambre || 0));
  juan.energia = clamp(juan.energia + (efecto.energia || 0));
  juan.felicidad = clamp(juan.felicidad + (efecto.felicidad || 0));
  juan.limpieza = clamp(juan.limpieza + (efecto.limpieza || 0));
  juan.xp = (juan.xp || 0) + 1;
  juan.ultimaAccion = def.label + (cuidador ? ' (' + cuidador + ')' : '');
  juan.actualizado = ahora;
  const nombreAccion = accion;
  if (!juan.acciones) juan.acciones = { alimentar: 0, jugar: 0, pasear: 0, acariciar: 0, banar: 0 };
  juan.acciones[nombreAccion] = (juan.acciones[nombreAccion] || 0) + 1;

  if (conectado) {
    await Juan.updateOne({ clave: 'juan' }, {
      $set: {
        hambre: juan.hambre, energia: juan.energia, felicidad: juan.felicidad,
        limpieza: juan.limpieza, xp: juan.xp, ultimaAccion: juan.ultimaAccion,
        actualizado: ahora, acciones: juan.acciones
      }
    }, { upsert: true });
    await Cuidado.create({ cuidador: cuidador || 'Anonimo', accion: accion, fecha: ahora });
  } else {
    Object.assign(memoria.juan, juan);
    memoria.cuidados.push({ cuidador: cuidador || 'Anonimo', accion: accion, fecha: ahora });
  }

  return { ok: true, label: def.label, juan: serializar(juan) };
}

module.exports = {
  iniciar, estadoConexion, leerJuan, cuidar, ranking, historial, totalCuidados, serializar, ACCIONES, nivelDe
};
