import jwt from 'jsonwebtoken';
import Client from '../clients/client.model.js';
import { env } from '../../config/index.js';
import { sendError } from '../../utils/index.js';

export default async function portalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, { message: 'Portal auth required', statusCode: 401, code: 'AUTH_REQUIRED' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    if (decoded.kind !== 'portal') {
      return sendError(res, { message: 'Invalid portal token', statusCode: 401, code: 'INVALID_TOKEN' });
    }
    const client = await Client.findById(decoded.sub);
    if (!client || !client.portalEnabled) {
      return sendError(res, { message: 'Portal access revoked', statusCode: 401, code: 'PORTAL_DISABLED' });
    }
    req.client = client;
    next();
  } catch {
    return sendError(res, { message: 'Invalid or expired token', statusCode: 401, code: 'INVALID_TOKEN' });
  }
}
