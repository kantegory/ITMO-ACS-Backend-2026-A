const notFoundHandler = (req, res) => {
  res.status(404).json({ statusCode: 404, error: 'Request Error', message: 'Маршрут API Gateway не найден' });
};

const errorHandler = (err, req, res, next) => {
  res.status(502).json({
    statusCode: 502,
    error: 'Bad Gateway',
    message: 'API Gateway не смог выполнить запрос к микросервису'
  });
};

module.exports = { notFoundHandler, errorHandler };
