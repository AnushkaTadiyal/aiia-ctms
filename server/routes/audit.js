const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

// GET audit logs with filters (Admin only, or Regulator for compliance audit)
router.get(
  '/',
  authenticateToken,
  requireRole([ROLES.ADMIN, ROLES.REGULATOR]),
  (req, res) => {
    try {
      const { entity, action, user, search, limit = 100 } = req.query;

      let query = `SELECT * FROM audit_log WHERE 1=1`;
      const params = [];

      if (entity && entity !== 'All') {
        query += ` AND entity_affected = ?`;
        params.push(entity);
      }

      if (action && action !== 'All') {
        query += ` AND action_type = ?`;
        params.push(action);
      }

      if (user && user !== 'All') {
        query += ` AND LOWER(user_name) LIKE LOWER(?)`;
        params.push(`%${user}%`);
      }

      if (search) {
        query += ` AND (
          LOWER(user_name) LIKE LOWER(?) OR
          LOWER(details) LIKE LOWER(?) OR
          LOWER(entity_id) LIKE LOWER(?) OR
          LOWER(ip_address) LIKE LOWER(?)
        )`;
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      query += ` ORDER BY timestamp DESC LIMIT ?`;
      params.push(Number(limit) || 100);

      const logs = db.prepare(query).all(...params);

      // Summary statistics for audit page
      const totalLogs = db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count;
      const actionStats = db.prepare(`
        SELECT action_type, COUNT(*) as count 
        FROM audit_log 
        GROUP BY action_type
      `).all();

      res.json({ logs, totalLogs, actionStats });
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      res.status(500).json({ error: 'Failed to retrieve audit trail.' });
    }
  }
);

module.exports = router;
