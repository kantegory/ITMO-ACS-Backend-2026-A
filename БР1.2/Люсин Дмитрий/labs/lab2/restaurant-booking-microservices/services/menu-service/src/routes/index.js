const router = require('express').Router();
const controller = require('../controllers/menu.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const serviceAuthMiddleware = require('../middlewares/serviceAuth.middleware');

router.get('/restaurants/:restaurantId/menu', controller.getMenu);
router.post('/restaurants/:restaurantId/menu-categories', authMiddleware, roleMiddleware('admin'), controller.createCategory);
router.post('/menu-categories/:categoryId/items', authMiddleware, roleMiddleware('admin'), controller.createItem);
router.patch('/menu-items/:itemId', authMiddleware, roleMiddleware('admin'), controller.updateItem);
router.delete('/menu-items/:itemId', authMiddleware, roleMiddleware('admin'), controller.deleteItem);
router.get('/internal/restaurants/:restaurantId/menu', serviceAuthMiddleware, controller.getMenu);

module.exports = router;
