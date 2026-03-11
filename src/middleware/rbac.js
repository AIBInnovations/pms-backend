import { sendError } from '../utils/index.js';

const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        message: 'Authentication required',
        statusCode: 401,
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        message: 'You do not have permission to perform this action',
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

export default rbac;
