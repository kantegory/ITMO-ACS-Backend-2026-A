from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import (
    Restaurant, Review, CuisineType,
    MenuItem, Reservation, RestaurantPhoto
)
from .serializers import (
    RestaurantListSerializer, RestaurantDetailSerializer,
    CuisineTypeSerializer, MenuItemSerializer, ReviewSerializer,
    ReservationSerializer, RestaurantPhotoSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="список типов кухни",
        tags=["Типы кухни"]
    ),
    retrieve=extend_schema(
        summary="тип кухни",
        tags=["Типы кухни"]
    ),
)
class CuisineTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CuisineType.objects.all()
    serializer_class = CuisineTypeSerializer
    permission_classes = [AllowAny]




@extend_schema_view(
    list=extend_schema(
        summary="список ресторанов",
        tags=["Рестораны"]
    ),
    retrieve=extend_schema(
        summary="ресторан",
        tags=["Рестораны"]
    ),
    create=extend_schema(
        summary="создать ресторан",
        tags=["Рестораны"]
    ),
    update=extend_schema(
        summary="обновить ресторан",
        tags=["Рестораны"]
    ),
    partial_update=extend_schema(
        summary="редактировать ресторан",
        tags=["Рестораны"]
    ),
    destroy=extend_schema(
        summary="удалить ресторан",
        tags=["Рестораны"]
    ),
    reviews=extend_schema(
        summary="отзывы ресторана",
        tags=["Отзывы"]
    ),
    add_review=extend_schema(
        summary="добавить отзыв",
        tags=["Отзывы"]
    ),
    photos=extend_schema(
        summary="фото ресторана",
        tags=["Фото"]
    ),
    add_photo=extend_schema(
        summary="загрузить фото",
        tags=["Фото"]
    ),
    menu=extend_schema(
        summary="меню ресторана",
        tags=["Меню"]
    ),
    add_menu_item=extend_schema(
        summary="добавить блюдо",
        tags=["Меню"]
    ),
)
class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'district', 'address']
    ordering_fields = ['created_at', 'price_range']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RestaurantDetailSerializer
        return RestaurantListSerializer
    
    def get_queryset(self):
        queryset = Restaurant.objects.all()
        
        price_range = self.request.query_params.get('price_range')
        if price_range:
            queryset = queryset.filter(price_range=price_range)
        
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(district=district)
        
        cuisine = self.request.query_params.get('cuisine')
        if cuisine:
            queryset = queryset.filter(cuisines__name=cuisine).distinct()
        
        return queryset
    

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def reviews(self, request, pk=None):
        restaurant = self.get_object()
        reviews = restaurant.review_set.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, pk=None):
        restaurant = self.get_object()
        data = request.data.copy()
        data['restaurant'] = restaurant.id
        data['user'] = request.user.id
        
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def photos(self, request, pk=None):
        restaurant = self.get_object()
        photos = restaurant.restaurantphoto_set.all()
        serializer = RestaurantPhotoSerializer(photos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_photo(self, request, pk=None):
        restaurant = self.get_object()
        serializer = RestaurantPhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(restaurant=restaurant)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def menu(self, request, pk=None):
        restaurant = self.get_object()
        menu_items = restaurant.menuitem_set.all()
        serializer = MenuItemSerializer(menu_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_menu_item(self, request, pk=None):
        restaurant = self.get_object()
        data = request.data.copy()
        data['restaurant'] = restaurant.id
        
        serializer = MenuItemSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        summary="список отзывов",
        tags=["Отзывы"]
    ),
    retrieve=extend_schema(
        summary="отзыв",
        tags=["Отзывы"]
    ),
    create=extend_schema(
        summary="создать отзыв",
        tags=["Отзывы"]
    ),
    update=extend_schema(
        summary="обновить отзыв",
        tags=["Отзывы"]
    ),
    partial_update=extend_schema(
        summary="редактировать отзыв",
        tags=["Отзывы"]
    ),
    destroy=extend_schema(
        summary="удалить отзыв",
        tags=["Отзывы"]
    ),
)
class ReviewViewSet(viewsets.ModelViewSet):

    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']


@extend_schema_view(
    list=extend_schema(
        summary="список блюд",
        tags=["Меню"]
    ),
    retrieve=extend_schema(
        summary="блюдо",
        tags=["Меню"]
    ),
    create=extend_schema(
        summary="создать блюдо",
        tags=["Меню"]
    ),
    update=extend_schema(
        summary="обновить блюдо",
        tags=["Меню"]
    ),
    partial_update=extend_schema(
        summary="редактировать блюдо",
        tags=["Меню"]
    ),
    destroy=extend_schema(
        summary="удалить блюдо",
        tags=["Меню"]
    ),
)
class MenuItemViewSet(viewsets.ModelViewSet):

    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price', 'created_at']


@extend_schema_view(
    list=extend_schema(
        summary="список бронирований",
        tags=["Бронирования"]
    ),
    retrieve=extend_schema(
        summary="бронирование",
        tags=["Бронирования"]
    ),
    create=extend_schema(
        summary="создать бронирование",
        tags=["Бронирования"]
    ),
    update=extend_schema(
        summary="обновить бронирование",
        tags=["Бронирования"]
    ),
    partial_update=extend_schema(
        summary="редактировать бронирование",
        tags=["Бронирования"]
    ),
    destroy=extend_schema(
        summary="удалить бронирование",
        tags=["Бронирования"]
    ),
    my=extend_schema(
        summary="мои бронирования",
        tags=["Бронирования"]
    ),
    status=extend_schema(
        summary="изменить статус",
        tags=["Бронирования"]
    ),
)
class ReservationViewSet(viewsets.ModelViewSet):

    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['reservation_date', 'created_at']
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my(self, request):
        reservations = Reservation.objects.filter(user_id=request.user.id)
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def status(self, request, pk=None):
        reservation = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['confirmed', 'cancelled']:
            reservation.status = new_status
            reservation.save()
            return Response(ReservationSerializer(reservation).data)
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        summary="список фото",
        tags=["Фото"]
    ),
    retrieve=extend_schema(
        summary="фото",
        tags=["Фото"]
    ),
    create=extend_schema(
        summary="загрузить фото",
        tags=["Фото"]
    ),
    update=extend_schema(
        summary="обновить фото",
        tags=["Фото"]
    ),
    partial_update=extend_schema(
        summary="редактировать фото",
        tags=["Фото"]
    ),
    destroy=extend_schema(
        summary="удалить фото",
        tags=["Фото"]
    ),
)
class RestaurantPhotoViewSet(viewsets.ModelViewSet):
    queryset = RestaurantPhoto.objects.all()
    serializer_class = RestaurantPhotoSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['uploaded_at']


@extend_schema_view(
    list=extend_schema(
        summary="мои бронирования",
        tags=["Профиль"]
    ),
    retrieve=extend_schema(
        summary="мое бронирование",
        tags=["Профиль"]
    ),
)
class UserReservationsViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Reservation.objects.filter(user_id=self.request.user.id)


@extend_schema_view(
    list=extend_schema(
        summary="мои отзывы",
        tags=["Профиль"]
    ),
    retrieve=extend_schema(
        summary="мой отзыв",
        tags=["Профиль"]
    ),
)
class UserReviewsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(user_id=self.request.user.id)
