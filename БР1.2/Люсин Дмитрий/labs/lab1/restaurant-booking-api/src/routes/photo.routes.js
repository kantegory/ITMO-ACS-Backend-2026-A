const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const photoController = require('../controllers/photo.controller');

router.delete('/:photoId', auth, permit('admin'), photoController.deletePhoto);

module.exports = router;
