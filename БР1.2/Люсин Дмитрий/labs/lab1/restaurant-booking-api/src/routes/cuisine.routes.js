const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const cuisineController = require('../controllers/cuisine.controller');

router.get('/', cuisineController.getCuisines);
router.post('/', auth, permit('admin'), cuisineController.createCuisine);
router.get('/:cuisineId', cuisineController.getCuisineById);
router.patch('/:cuisineId', auth, permit('admin'), cuisineController.updateCuisine);
router.delete('/:cuisineId', auth, permit('admin'), cuisineController.deleteCuisine);

module.exports = router;
