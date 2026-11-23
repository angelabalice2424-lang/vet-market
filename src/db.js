const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite'); // SQLite integrado en Node 22+, sin compilar nada
const bcrypt = require('bcryptjs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'vet.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      license TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'vet')),
      vet_id INTEGER REFERENCES vets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vet_id INTEGER NOT NULL REFERENCES vets(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_minutes INTEGER NOT NULL DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vet_id INTEGER NOT NULL REFERENCES vets(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      owner_phone TEXT,
      pet_name TEXT NOT NULL,
      pet_species TEXT NOT NULL,
      pet_breed TEXT,
      pet_age TEXT,
      pet_weight TEXT,
      reason TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      urgent INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'done')),
      room TEXT NOT NULL,
      cancel_token TEXT NOT NULL UNIQUE,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Un mismo veterinario no puede tener dos turnos activos en el mismo horario
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_booked_slot
      ON appointments (vet_id, date, time) WHERE status = 'booked';
  `);

  const hasAdmin = db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
  if (!hasAdmin && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin')")
      .run(process.env.ADMIN_EMAIL.trim().toLowerCase(), bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12));
    console.log('Cuenta de administrador creada.');
  }
}

module.exports = { db, initDb };
