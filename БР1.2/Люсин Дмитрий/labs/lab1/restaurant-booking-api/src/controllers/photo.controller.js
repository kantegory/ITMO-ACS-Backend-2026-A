const { Restaurant, RestaurantPhoto } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toPhotoResponse } = require('../views/photo.view');

const getRestaurantPhotos = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const photos = await RestaurantPhoto.findAll({ where: { restaurant_id: restaurant.id } });
  res.json({ data: photos.map(toPhotoResponse) });
});

const createRestaurantPhoto = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const { photo_url, is_main = false } = req.body;

  if (!photo_url) {
    throw new ApiError(400, 'Ссылка на фото обязательна');
  }

  if (is_main) {
    await RestaurantPhoto.update({ is_main: false }, { where: { restaurant_id: restaurant.id } });
  }

  const photo = await RestaurantPhoto.create({ restaurant_id: restaurant.id, photo_url, is_main });
  res.status(201).json({ photo: toPhotoResponse(photo) });
});

const deletePhoto = asyncHandler(async (req, res) => {
  const photo = await RestaurantPhoto.findByPk(req.params.photoId);

  if (!photo) {
    throw new ApiError(404, 'Фото не найдено');
  }

  await photo.destroy();
  res.status(204).send();
});

module.exports = { getRestaurantPhotos, createRestaurantPhoto, deletePhoto };
