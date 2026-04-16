function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function sanitizeDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    // Remove potential MongoDB operator injection keys.
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }

    sanitized[key] = sanitizeDeep(nestedValue);
  }

  return sanitized;
}

function sanitizeRequest(req, _res, next) {
  req.body = sanitizeDeep(req.body);
  req.query = sanitizeDeep(req.query);
  req.params = sanitizeDeep(req.params);
  next();
}

module.exports = { sanitizeRequest };
