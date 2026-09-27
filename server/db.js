const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'ctms.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      organization TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ctri_number TEXT UNIQUE NOT NULL,
      public_title TEXT NOT NULL,
      scientific_title TEXT NOT NULL,
      pi_name TEXT NOT NULL,
      pi_id INTEGER,
      department TEXT NOT NULL,
      site_name TEXT NOT NULL,
      ethics_status TEXT NOT NULL DEFAULT 'Submitted',
      ethics_approval_date TEXT,
      ethics_notes TEXT,
      dcgi_approval TEXT NOT NULL DEFAULT 'Yes',
      health_condition TEXT NOT NULL,
      study_type TEXT NOT NULL DEFAULT 'Interventional',
      phase TEXT NOT NULL DEFAULT 'Phase 2',
      intervention TEXT NOT NULL,
      comparator TEXT NOT NULL,
      target_sample_size_india INTEGER NOT NULL,
      target_sample_size_total INTEGER NOT NULL,
      current_enrollment INTEGER NOT NULL DEFAULT 0,
      recruitment_status TEXT NOT NULL DEFAULT 'Open to recruitment',
      date_of_first_enrollment TEXT,
      estimated_duration TEXT NOT NULL,
      current_stage TEXT NOT NULL DEFAULT 'Enrollment',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pi_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS adverse_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      trial_id INTEGER NOT NULL,
      event_description TEXT NOT NULL,
      severity TEXT NOT NULL,
      seriousness TEXT NOT NULL,
      event_date TEXT NOT NULL,
      report_date TEXT NOT NULL,
      meddra_code TEXT NOT NULL,
      meddra_term TEXT NOT NULL,
      outcome TEXT DEFAULT 'Recovered',
      causality TEXT DEFAULT 'Possible',
      reporting_status TEXT DEFAULT 'On-Time',
      reported_by INTEGER,
      action_taken TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trial_id) REFERENCES trials(id) ON DELETE CASCADE,
      FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS protocol_deviations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trial_id INTEGER NOT NULL,
      patient_id TEXT,
      deviation_type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      action_taken TEXT,
      status TEXT DEFAULT 'Open',
      flagged_by INTEGER,
      flagged_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trial_id) REFERENCES trials(id) ON DELETE CASCADE,
      FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entity_affected TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      reset_code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'info',
      related_type TEXT DEFAULT 'system',
      related_id INTEGER DEFAULT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

initSchema();

function logAudit({ userId, userName, userRole, actionType, entityAffected, entityId, details, ipAddress }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_log (user_id, user_name, user_role, action_type, entity_affected, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      userId || null,
      userName || 'System',
      userRole || 'System',
      actionType,
      entityAffected,
      entityId ? String(entityId) : null,
      typeof details === 'object' ? JSON.stringify(details) : (details || ''),
      ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

module.exports = { db, logAudit };
