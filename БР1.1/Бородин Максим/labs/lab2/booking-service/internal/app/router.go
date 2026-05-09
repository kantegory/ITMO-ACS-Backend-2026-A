package app

import (
	"database/sql"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	cancelbookingH "github.com/borodin-maksim/restaurant-booking/booking-service/internal/api/handler/cancel_booking"
	createbookingH "github.com/borodin-maksim/restaurant-booking/booking-service/internal/api/handler/create_booking"
	listbookingsH "github.com/borodin-maksim/restaurant-booking/booking-service/internal/api/handler/list_bookings"
	mybookingsH "github.com/borodin-maksim/restaurant-booking/booking-service/internal/api/handler/my_bookings"
	tableavailabilityH "github.com/borodin-maksim/restaurant-booking/booking-service/internal/api/handler/table_availability"
	restaurantclient "github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/client/restaurant"
	bookingrepo "github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/database/booking"
	"github.com/borodin-maksim/restaurant-booking/booking-service/internal/infrastructure/middleware"
	cancelbookinguc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/cancel_booking"
	createbookinguc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/create_booking"
	listbookingsuc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/list_bookings"
	mybookingsuc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/my_bookings"
	tableavailabilityuc "github.com/borodin-maksim/restaurant-booking/booking-service/internal/usecase/table_availability"
)

type Deps struct {
	Log                   *slog.Logger
	DB                    *sql.DB
	RestaurantServiceURL  string
}

func NewRouter(d Deps) http.Handler {
	bookingRepo := bookingrepo.NewRepository(d.DB)
	restClient := restaurantclient.New(d.RestaurantServiceURL)

	createBookingUseCase := createbookinguc.New(bookingRepo, restClient)
	myBookingsUseCase := mybookingsuc.New(bookingRepo)
	cancelBookingUseCase := cancelbookinguc.New(bookingRepo)
	listBookingsUseCase := listbookingsuc.New(bookingRepo)
	tableAvailabilityUseCase := tableavailabilityuc.New(bookingRepo, restClient)

	createBookingHandler := createbookingH.New(createBookingUseCase)
	myBookingsHandler := mybookingsH.New(myBookingsUseCase)
	cancelBookingHandler := cancelbookingH.New(cancelBookingUseCase)
	listBookingsHandler := listbookingsH.New(listBookingsUseCase)
	tableAvailabilityHandler := tableavailabilityH.New(tableAvailabilityUseCase)

	r := chi.NewRouter()
	r.Use(middleware.Recovery(d.Log))
	r.Use(middleware.Logger(d.Log))
	r.Use(chimw.RequestID)
	r.Use(middleware.Identity)

	r.Get("/restaurants/{id}/tables/availability", tableAvailabilityHandler.Handle)

	r.Post("/bookings", createBookingHandler.Handle)
	r.Get("/bookings/my", myBookingsHandler.Handle)
	r.Post("/bookings/{id}/cancel", cancelBookingHandler.Handle)

	r.Get("/admin/bookings", listBookingsHandler.Handle)

	return r
}
