const photoView = (photo) => ({
  id: photo.id,
  restaurant_id: photo.restaurant_id,
  photo_url: photo.photo_url,
  is_main: photo.is_main,
  created_at: photo.created_at || photo.createdAt,
  updated_at: photo.updated_at || photo.updatedAt
});

module.exports = { photoView };
