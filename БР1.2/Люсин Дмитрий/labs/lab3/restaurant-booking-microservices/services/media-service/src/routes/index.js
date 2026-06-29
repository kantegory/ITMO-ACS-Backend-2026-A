const router = require('express').Router();
const controller = require('../controllers/photo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const serviceAuthMiddleware = require('../middlewares/serviceAuth.middleware');

router.get('/restaurants/:restaurantId/photos', controller.getPhotos);
router.post('/restaurants/:restaurantId/photos', authMiddleware, roleMiddleware('admin'), controller.createPhoto);
router.delete('/restaurant-photos/:photoId', authMiddleware, roleMiddleware('admin'), controller.deletePhoto);
router.get('/internal/restaurants/:restaurantId/photos', serviceAuthMiddleware, controller.getPhotos);

module.exports = router;
