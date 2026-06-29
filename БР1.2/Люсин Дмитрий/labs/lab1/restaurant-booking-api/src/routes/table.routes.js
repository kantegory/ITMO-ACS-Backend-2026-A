const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const tableController = require('../controllers/table.controller');

router.patch('/:tableId', auth, permit('admin'), tableController.updateTable);
router.delete('/:tableId', auth, permit('admin'), tableController.deleteTable);

module.exports = router;
