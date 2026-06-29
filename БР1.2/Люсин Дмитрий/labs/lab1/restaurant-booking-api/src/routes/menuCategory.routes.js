const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const menuController = require('../controllers/menu.controller');

router.patch('/:categoryId', auth, permit('admin'), menuController.updateMenuCategory);
router.delete('/:categoryId', auth, permit('admin'), menuController.deleteMenuCategory);
router.post('/:categoryId/items', auth, permit('admin'), menuController.createMenuItem);

module.exports = router;
