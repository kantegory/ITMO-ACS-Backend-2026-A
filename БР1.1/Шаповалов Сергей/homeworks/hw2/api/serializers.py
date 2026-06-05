from rest_framework import serializers
from .models import (
    Role, UserProfile, Restaurant, Review, CuisineType,
    RestaurantCuisine, MenuItem, Reservation, RestaurantPhoto
)
from django.contrib.auth.hashers import make_password


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']


class UserProfileSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'first_name', 'last_name', 'middle_name', 'email', 'role', 'role_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserRegisterSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации (используется Djoser)"""
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(default='user', required=False)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'first_name', 'last_name', 'middle_name', 'email', 'password', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        role_name = validated_data.pop('role', 'user')
        password = validated_data.pop('password')
        
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            role = Role.objects.get(name='user')
        
        user = UserProfile.objects.create(
            **validated_data,
            role=role,
            password=make_password(password)
        )
        return user


class CuisineTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuisineType
        fields = ['id', 'name']


class RestaurantCuisineSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='cuisine_type.name', read_only=True)
    
    class Meta:
        model = RestaurantCuisine
        fields = ['id', 'cuisine_type', 'name']


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'restaurant', 'name', 'description', 'price']
        read_only_fields = ['id']


class RestaurantPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantPhoto
        fields = ['id', 'restaurant', 'photo_url', 'photo', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'restaurant', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class RestaurantListSerializer(serializers.ModelSerializer):
    cuisines = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'address', 'price_range', 'district', 'cuisines', 'average_rating']
    
    def get_cuisines(self, obj):
        cuisines = obj.cuisines.all()
        return [cuisine.name for cuisine in cuisines]
    
    def get_average_rating(self, obj):
        return obj.get_average_rating()


class RestaurantDetailSerializer(serializers.ModelSerializer):
    cuisines = serializers.SerializerMethodField()
    menu_items = MenuItemSerializer(source='menuitem_set', many=True, read_only=True)
    photos = RestaurantPhotoSerializer(source='restaurantphoto_set', many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'description', 'address', 'price_range', 'district', 
                  'created_at', 'cuisines', 'menu_items', 'photos', 'average_rating']
        read_only_fields = ['id', 'created_at']
    
    def get_cuisines(self, obj):
        cuisines = obj.cuisines.all()
        return [cuisine.name for cuisine in cuisines]
    
    def get_average_rating(self, obj):
        return obj.get_average_rating()


class ReservationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    
    class Meta:
        model = Reservation
        fields = ['id', 'user', 'user_name', 'restaurant', 'restaurant_name', 
                  'start_time', 'guest_count', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
