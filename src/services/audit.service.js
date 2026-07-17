const AuditLog = require('../models/AuditLog');

const getRequestContext = (req) => {
  if (!req) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }

  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  };
};

const createAuditLog = async ({
  actor = null,
  action,
  entityType = null,
  entityId = null,
  metadata = {},
  req = null,
}) => {
  const { ipAddress, userAgent } = getRequestContext(req);

  try {
    await AuditLog.create({
      actor,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (error) {
    console.error(`Audit log write failed: ${error.message}`);
  }
};

module.exports = {
  createAuditLog,
};
