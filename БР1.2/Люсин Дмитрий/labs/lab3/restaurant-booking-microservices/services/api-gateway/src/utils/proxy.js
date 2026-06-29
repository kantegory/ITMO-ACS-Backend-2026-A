const axios = require('axios');

const createProxy = (target) => async (req, res, next) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${target}${req.originalUrl}`,
      data: req.body,
      params: req.query,
      headers: {
        authorization: req.headers.authorization,
        'content-type': req.headers['content-type']
      },
      validateStatus: () => true
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    next(error);
  }
};

module.exports = createProxy;
