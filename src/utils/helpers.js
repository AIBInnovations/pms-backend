import crypto from 'crypto';

export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export const paginate = (query, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

export const buildPaginationMeta = (total, page, limit) => ({
  page: parseInt(page, 10),
  limit: parseInt(limit, 10),
  total,
  totalPages: Math.ceil(total / limit),
});
