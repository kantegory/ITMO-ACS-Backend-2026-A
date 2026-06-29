const { RestaurantPhoto } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ensureRestaurantExists } = require('../utils/serviceClient');
const { photoView } = require('../views/photo.view');

const getPhotos = asyncHandler(async (req, res) => {
  await ensureRestaurantExists(req.params.restaurantId);

  const photos = await RestaurantPhoto.findAll({
    where: { restaurant_id: req.params.restaurantId },
    order: [['is_main', 'DESC'], ['id', 'ASC']]
  });

  res.json({ data: photos.map(photoView) });
});

const createPhoto = asyncHandler(async (req, res) => {
  await ensureRestaurantExists(req.params.restaurantId);

  const { photo_url, is_main = false } = req.body;

  if (!photo_url) {
    throw new ApiError(400, 'Необходимо указать photo_url');
  }

  const photo = await RestaurantPhoto.create({ restaurant_id: req.params.restaurantId, photo_url, is_main });

  res.status(201).json({ photo: photoView(photo) });
});

const deletePhoto = asyncHandler(async (req, res) => {
  const photo = await RestaurantPhoto.findByPk(req.params.photoId);

  if (!photo) {
    throw new ApiError(404, 'Фотография не найдена');
  }

  await photo.destroy();

  res.status(204).send();
});

module.exports = { getPhotos, createPhoto, deletePhoto };
