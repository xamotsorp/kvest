function requireSiteAccess(req, res, next) {
  if (req.signedCookies && req.signedCookies.site_access === '1') {
    return next();
  }
  return res.status(401).json({ error: 'no_access' });
}

function requireAdmin(req, res, next) {
  if (req.signedCookies && req.signedCookies.admin_session === '1') {
    return next();
  }
  return res.status(401).json({ error: 'no_access' });
}

module.exports = { requireSiteAccess, requireAdmin };
