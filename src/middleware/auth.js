import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';
import { sendError } from '../utils/index.js';

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, {
      message: 'Authentication required',
      statusCode: 401,
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, {
        message: 'Token expired',
        statusCode: 401,
        code: 'TOKEN_EXPIRED',
      });
    }
    return sendError(res, {
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  }
};

export default auth;
