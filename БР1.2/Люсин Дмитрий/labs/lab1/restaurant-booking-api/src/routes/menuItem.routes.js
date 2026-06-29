const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const menuController = require('../controllers/menu.controller');

router.patch('/:itemId', auth, permit('admin'), menuController.updateMenuItem);
router.delete('/:itemId', auth, permit('admin'), menuController.deleteMenuItem);

module.exports = router;
