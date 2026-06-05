from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Role(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'User'),
        ('owner', 'Owner'),
    ]
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'roles'
        verbose_name_plural = 'Roles'


class UserProfile(models.Model):
    id = models.AutoField(primary_key=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    class Meta:
        db_table = 'users'
        verbose_name_plural = 'Users'


class CuisineType(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'cuisine_types'
        verbose_name_plural = 'Cuisine Types'


class Restaurant(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    price_range = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        null=True,
        blank=True
    )
    district = models.CharField(max_length=100, null=True, blank=True)
    cuisines = models.ManyToManyField(CuisineType, through='RestaurantCuisine')
    
    def __str__(self):
        return self.name
    
    def get_average_rating(self):
        reviews = self.review_set.all()
        if reviews.exists():
            total_rating = sum([review.rating for review in reviews])
            return round(total_rating / reviews.count(), 2)
        return 0
    
    class Meta:
        db_table = 'restaurants'
        verbose_name_plural = 'Restaurants'


class RestaurantCuisine(models.Model):
    id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    cuisine_type = models.ForeignKey(CuisineType, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.restaurant.name} - {self.cuisine_type.name}"
    
    class Meta:
        db_table = 'restaurant_cuisines'
        verbose_name_plural = 'Restaurant Cuisines'
        unique_together = ('restaurant', 'cuisine_type')


class RestaurantPhoto(models.Model):
    id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    photo_url = models.URLField(null=True, blank=True)
    photo = models.ImageField(upload_to='restaurant_photos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Photo for {self.restaurant.name}"
    
    class Meta:
        db_table = 'restaurant_photos'
        verbose_name_plural = 'Restaurant Photos'


class Review(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Review by {self.user.first_name} for {self.restaurant.name}"
    
    class Meta:
        db_table = 'reviews'
        verbose_name_plural = 'Reviews'


class MenuItem(models.Model):
    id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"
    
    class Meta:
        db_table = 'menu_items'
        verbose_name_plural = 'Menu Items'


class Reservation(models.Model):
    """Бронирования"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    guest_count = models.IntegerField(validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Reservation for {self.user.first_name} at {self.restaurant.name}"
    
    class Meta:
        db_table = 'reservations'
        verbose_name_plural = 'Reservations'
