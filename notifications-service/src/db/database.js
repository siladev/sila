/**
 * Módulo de base de datos SQLite (via sql.js — WASM, sin dependencias nativas).
 *
 * Expone helpers síncronos una vez inicializado.
 * La inicialización es async (carga del WASM).
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let _db = null;

async function initDatabase() {
  if (_db) return _db;

  const SQL = await initSqlJs();

  // Asegurar que el directorio de datos exista
  const dbDir = path.dirname(config.db.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Cargar base existente o crear nueva
  if (fs.existsSync(config.db.path)) {
    const fileBuffer = fs.readFileSync(config.db.path);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Crear tabla de notificaciones si no existe
  _db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      type         TEXT    NOT NULL,
      category     TEXT    NOT NULL,
      title        TEXT    NOT NULL,
      message      TEXT    NOT NULL,
      amount_spent REAL    NOT NULL,
      amount_limit REAL    NOT NULL,
      is_read      INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Índice para listar notificaciones por usuario ordenadas por fecha
  _db.run(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications (user_id, created_at);
  `);

  // Índice para filtrar notificaciones pendientes de lectura
  _db.run(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications (user_id, is_read);
  `);

  save();

  return _db;
}

/** Persiste la base de datos a disco. */
function save() {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.db.path, buffer);
}

/**
 * Ejecuta un INSERT/UPDATE/DELETE y persiste.
 * @param {string} sql
 * @param {any[]} params
 * @returns {{ lastInsertRowid: number }}
 */
function run(sql, params = []) {
  _db.run(sql, params);

  // Obtener el last insert rowid antes de cualquier otra operación
  const result = _db.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = result.length > 0 ? Number(result[0].values[0][0]) : 0;

  save();

  return { lastInsertRowid };
}

/**
 * Ejecuta un SELECT y retorna la primera fila como objeto, o undefined.
 * @param {string} sql
 * @param {any[]} params
 * @returns {object|undefined}
 */
function get(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);

  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();

    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    return row;
  }

  stmt.free();
  return undefined;
}

/**
 * Ejecuta un SELECT y retorna todas las filas como array de objetos.
 * @param {string} sql
 * @param {any[]} params
 * @returns {object[]}
 */
function all(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);

  const rows = [];
  while (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    rows.push(row);
  }

  stmt.free();
  return rows;
}

module.exports = { initDatabase, run, get, all };
