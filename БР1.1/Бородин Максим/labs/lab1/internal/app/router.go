package app

import (
	"database/sql"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	addreviewH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/add_review"
	cancelbookingH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/cancel_booking"
	createbookingH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/create_booking"
	createrestaurantH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/create_restaurant"
	createtableH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/create_table"
	getrestaurantH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/get_restaurant"
	listbookingsH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/list_bookings"
	listrestaurantsH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/list_restaurants"
	listreviewsH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/list_reviews"
	loginH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/login"
	mybookingsH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/my_bookings"
	profileH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/profile"
	registerH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/register"
	tableavailabilityH "github.com/borodin-maksim/restaurant-booking/internal/api/handler/table_availability"

	"github.com/borodin-maksim/restaurant-booking/internal/domain"
	bookingrepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/booking"
	menurepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/menu"
	restaurantrepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/restaurant"
	reviewrepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/review"
	tablerepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/table"
	userrepo "github.com/borodin-maksim/restaurant-booking/internal/infrastructure/database/user"
	"github.com/borodin-maksim/restaurant-booking/internal/infrastructure/middleware"

	addreviewuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/add_review"
	cancelbookinguc "github.com/borodin-maksim/restaurant-booking/internal/usecase/cancel_booking"
	createbookinguc "github.com/borodin-maksim/restaurant-booking/internal/usecase/create_booking"
	createrestaurantuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/create_restaurant"
	createtableuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/create_table"
	getprofileuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/get_profile"
	getrestaurantuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/get_restaurant"
	listbookingsuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/list_bookings"
	listrestaurantsuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/list_restaurants"
	listreviewsuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/list_reviews"
	loginuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/login"
	mybookingsuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/my_bookings"
	registeruc "github.com/borodin-maksim/restaurant-booking/internal/usecase/register"
	tableavailabilityuc "github.com/borodin-maksim/restaurant-booking/internal/usecase/table_availability"
)

type Deps struct {
	Log       *slog.Logger
	JWTSecret string
	DB        *sql.DB
}

func NewRouter(d Deps) http.Handler {
	userRepo := userrepo.NewRepository(d.DB)
	restaurantRepo := restaurantrepo.NewRepository(d.DB)
	tableRepo := tablerepo.NewRepository(d.DB)
	bookingRepo := bookingrepo.NewRepository(d.DB)
	reviewRepo := reviewrepo.NewRepository(d.DB)
	menuRepo := menurepo.NewRepository(d.DB)

	registerUseCase := registeruc.New(userRepo)
	loginUseCase := loginuc.New(userRepo)
	profileUseCase := getprofileuc.New(userRepo)
	listRestaurantsUseCase := listrestaurantsuc.New(restaurantRepo)
	getRestaurantUseCase := getrestaurantuc.New(restaurantRepo, menuRepo)
	createBookingUseCase := createbookinguc.New(bookingRepo, tableRepo)
	myBookingsUseCase := mybookingsuc.New(bookingRepo)
	cancelBookingUseCase := cancelbookinguc.New(bookingRepo)
	addReviewUseCase := addreviewuc.New(reviewRepo, restaurantRepo)
	createRestaurantUseCase := createrestaurantuc.New(restaurantRepo)
	createTableUseCase := createtableuc.New(tableRepo, restaurantRepo)
	listBookingsUseCase := listbookingsuc.New(bookingRepo)
	tableAvailabilityUseCase := tableavailabilityuc.New(tableRepo, restaurantRepo)
	listReviewsUseCase := listreviewsuc.New(reviewRepo, restaurantRepo)

	registerHandler := registerH.New(registerUseCase)
	loginHandler := loginH.New(loginUseCase, d.JWTSecret)
	profileHandler := profileH.New(profileUseCase)
	listRestaurantsHandler := listrestaurantsH.New(listRestaurantsUseCase)
	getRestaurantHandler := getrestaurantH.New(getRestaurantUseCase)
	createBookingHandler := createbookingH.New(createBookingUseCase)
	myBookingsHandler := mybookingsH.New(myBookingsUseCase)
	cancelBookingHandler := cancelbookingH.New(cancelBookingUseCase)
	addReviewHandler := addreviewH.New(addReviewUseCase)
	createRestaurantHandler := createrestaurantH.New(createRestaurantUseCase)
	createTableHandler := createtableH.New(createTableUseCase)
	listBookingsHandler := listbookingsH.New(listBookingsUseCase)
	tableAvailabilityHandler := tableavailabilityH.New(tableAvailabilityUseCase)
	listReviewsHandler := listreviewsH.New(listReviewsUseCase)

	r := chi.NewRouter()
	r.Use(middleware.Recovery(d.Log))
	r.Use(middleware.Logger(d.Log))
	r.Use(chimw.RequestID)

	r.Post("/register", registerHandler.Handle)
	r.Post("/login", loginHandler.Handle)
	r.Get("/restaurants", listRestaurantsHandler.Handle)
	r.Get("/restaurants/{id}", getRestaurantHandler.HandleGet)
	r.Get("/restaurants/{id}/menu", getRestaurantHandler.HandleMenu)
	r.Get("/restaurants/{id}/reviews", listReviewsHandler.Handle)
	r.Get("/restaurants/{id}/tables/availability", tableAvailabilityHandler.Handle)

	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(d.JWTSecret))

		r.Get("/profile", profileHandler.Handle)

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireRole(domain.RoleUser))
			r.Post("/restaurants/{id}/reviews", addReviewHandler.Handle)
			r.Post("/bookings", createBookingHandler.Handle)
			r.Get("/bookings/my", myBookingsHandler.Handle)
			r.Post("/bookings/{id}/cancel", cancelBookingHandler.Handle)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireRole(domain.RoleAdmin))
			r.Post("/admin/restaurants", createRestaurantHandler.Handle)
			r.Post("/admin/restaurants/{id}/tables", createTableHandler.Handle)
			r.Get("/admin/bookings", listBookingsHandler.Handle)
		})
	})

	return r
}
