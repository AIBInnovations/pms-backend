export const sendSuccess = (res, { data = null, message = 'Success', statusCode = 200, meta = null } = {}) => {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendError = (res, { message = 'Something went wrong', statusCode = 500, code = 'SERVER_ERROR', details = null } = {}) => {
  const response = {
    success: false,
    error: { code, message },
  };
  if (details) response.error.details = details;
  return res.status(statusCode).json(response);
};
