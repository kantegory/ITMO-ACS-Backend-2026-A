package app

import (
	"database/sql"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	profileH "github.com/borodin-maksim/restaurant-booking/auth-service/internal/api/handler/profile"
	loginH "github.com/borodin-maksim/restaurant-booking/auth-service/internal/api/handler/login"
	registerH "github.com/borodin-maksim/restaurant-booking/auth-service/internal/api/handler/register"
	userrepo "github.com/borodin-maksim/restaurant-booking/auth-service/internal/infrastructure/database/user"
	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/infrastructure/middleware"
	getprofileuc "github.com/borodin-maksim/restaurant-booking/auth-service/internal/usecase/get_profile"
	loginuc "github.com/borodin-maksim/restaurant-booking/auth-service/internal/usecase/login"
	registeruc "github.com/borodin-maksim/restaurant-booking/auth-service/internal/usecase/register"
)

type Deps struct {
	Log       *slog.Logger
	JWTSecret string
	DB        *sql.DB
}

func NewRouter(d Deps) http.Handler {
	userRepo := userrepo.NewRepository(d.DB)

	registerUseCase := registeruc.New(userRepo)
	loginUseCase := loginuc.New(userRepo)
	profileUseCase := getprofileuc.New(userRepo)

	registerHandler := registerH.New(registerUseCase)
	loginHandler := loginH.New(loginUseCase, d.JWTSecret)
	profileHandler := profileH.New(profileUseCase)

	r := chi.NewRouter()
	r.Use(middleware.Recovery(d.Log))
	r.Use(middleware.Logger(d.Log))
	r.Use(chimw.RequestID)

	r.Post("/register", registerHandler.Handle)
	r.Post("/login", loginHandler.Handle)

	r.Group(func(r chi.Router) {
		r.Use(middleware.Identity)
		r.Get("/profile", profileHandler.Handle)
	})

	return r
}
