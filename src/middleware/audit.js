import auditService from '../modules/notifications/audit.service.js';
import { logger } from '../config/index.js';

const auditActions = {
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

const audit = (module) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Only log successful write operations
      if (req.user && auditActions[req.method] && body?.success) {
        const targetId = req.params.id || body?.data?._id;

        auditService
          .log({
            userId: req.user.id,
            action: `${auditActions[req.method]}_${module}`,
            module,
            targetId,
            targetModel: module,
            metadata: {
              method: req.method,
              path: req.originalUrl,
              body: req.method !== 'DELETE' ? req.body : undefined,
            },
            ipAddress: req.ip,
          })
          .catch((err) => logger.error('Audit log failed:', err));
      }

      return originalJson(body);
    };

    next();
  };
};

export default audit;
