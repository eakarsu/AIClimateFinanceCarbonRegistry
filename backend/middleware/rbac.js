// Role-based access control.
//   admin     — full access
//   registrar — read + write
//   auditor   — read + verify (no destructive writes)
//
// Usage:
//   router.post('/', requireRole('admin','registrar'), handler)
//   router.delete('/:id', requireRole('admin'), handler)

function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role) return res.status(401).json({ error: 'Auth required' });
    if (!allowed.includes(role)) {
      return res.status(403).json({
        error: `Role '${role}' is not permitted (allowed: ${allowed.join(', ')})`,
      });
    }
    next();
  };
}

// Convenience: any authenticated user with a non-empty role can read
function requireAnyRole(req, res, next) {
  if (!req.user || !req.user.role) return res.status(401).json({ error: 'Auth required' });
  next();
}

module.exports = { requireRole, requireAnyRole };
