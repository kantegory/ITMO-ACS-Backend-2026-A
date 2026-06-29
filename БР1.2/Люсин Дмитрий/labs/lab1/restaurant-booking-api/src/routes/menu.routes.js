const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const menuController = require('../controllers/menu.controller');

router.patch('/categories/:categoryId', auth, permit('admin'), menuController.updateMenuCategory);
router.delete('/categories/:categoryId', auth, permit('admin'), menuController.deleteMenuCategory);
router.post('/categories/:categoryId/items', auth, permit('admin'), menuController.createMenuItem);
router.patch('/items/:menuItemId', auth, permit('admin'), menuController.updateMenuItem);
router.delete('/items/:menuItemId', auth, permit('admin'), menuController.deleteMenuItem);

module.exports = router;
