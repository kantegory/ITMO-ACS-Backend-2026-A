from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RestaurantViewSet, ReviewViewSet,
    CuisineTypeViewSet, MenuItemViewSet, ReservationViewSet,
    RestaurantPhotoViewSet, UserReservationsViewSet, UserReviewsViewSet
)

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'cuisine-types', CuisineTypeViewSet, basename='cuisine-type')
router.register(r'menu-items', MenuItemViewSet, basename='menu-item')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'photos', RestaurantPhotoViewSet, basename='photo')

urlpatterns = [
    path('', include(router.urls)),
    path('users/me/reservations/', UserReservationsViewSet.as_view({'get': 'list'}), name='user-reservations'),
    path('users/me/reviews/', UserReviewsViewSet.as_view({'get': 'list'}), name='user-reviews'),
]
