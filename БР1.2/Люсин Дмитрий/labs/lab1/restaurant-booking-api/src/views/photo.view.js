const toPhotoResponse = (photo) => ({
  id: photo.id,
  restaurant_id: photo.restaurant_id,
  photo_url: photo.photo_url,
  is_main: photo.is_main,
});

module.exports = { toPhotoResponse };
