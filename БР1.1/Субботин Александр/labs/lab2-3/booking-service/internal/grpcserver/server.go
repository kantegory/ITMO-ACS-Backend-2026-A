package grpcserver

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/ZZISST/rental-booking-service/internal/client"
	"github.com/ZZISST/rental-booking-service/internal/messaging"
	"github.com/ZZISST/rental-booking-service/internal/model"
	pb "github.com/ZZISST/rental-booking-service/internal/pb/bookingpb"
	"github.com/ZZISST/rental-booking-service/internal/repository"
)

type BookingServer struct {
	pb.UnimplementedBookingServiceServer
	bookingRepo    *repository.BookingRepository
	reviewRepo     *repository.ReviewRepository
	propertyClient *client.PropertyClient
	publisher      *messaging.Publisher
	jwtSecret      string
}

func NewBookingServer(
	bookingRepo *repository.BookingRepository,
	reviewRepo *repository.ReviewRepository,
	propertyClient *client.PropertyClient,
	publisher *messaging.Publisher,
	jwtSecret string,
) *BookingServer {
	return &BookingServer{
		bookingRepo:    bookingRepo,
		reviewRepo:     reviewRepo,
		propertyClient: propertyClient,
		publisher:      publisher,
		jwtSecret:      jwtSecret,
	}
}

func userIDFromContext(ctx context.Context, secret string) (string, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "", status.Error(codes.Unauthenticated, "missing authorization header")
	}

	headers := md.Get("authorization")
	if len(headers) == 0 {
		return "", status.Error(codes.Unauthenticated, "missing authorization header")
	}

	parts := strings.SplitN(headers[0], " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", status.Error(codes.Unauthenticated, "invalid authorization header format")
	}

	token, err := jwt.Parse(parts[1], func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return "", status.Error(codes.Unauthenticated, "invalid or expired token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", status.Error(codes.Unauthenticated, "invalid token claims")
	}

	userID, ok := claims["user_id"].(string)
	if !ok || userID == "" {
		return "", status.Error(codes.Unauthenticated, "user_id not found in token")
	}

	return userID, nil
}

func normalizePagination(limit, offset int32) (int, int) {
	l := int(limit)
	o := int(offset)
	if l <= 0 || l > 100 {
		l = 20
	}
	if o < 0 {
		o = 0
	}
	return l, o
}

func timestampFromTime(t time.Time) *timestamppb.Timestamp {
	return timestamppb.New(t)
}

func optionalString(v *string) *string {
	if v == nil {
		return nil
	}
	value := *v
	return &value
}

func bookingToProto(b *model.Booking) *pb.Booking {
	return &pb.Booking{
		Id:          b.ID,
		PropertyId:  b.PropertyID,
		TenantId:    b.TenantID,
		StartDate:   b.StartDate,
		EndDate:     b.EndDate,
		GuestsCount: int32(b.GuestsCount),
		PriceTotal:  b.PriceTotal,
		Status:      b.Status,
		CreatedAt:   timestampFromTime(b.CreatedAt),
		UpdatedAt:   timestampFromTime(b.UpdatedAt),
	}
}

func bookingsToProto(items []model.Booking) []*pb.Booking {
	result := make([]*pb.Booking, 0, len(items))
	for i := range items {
		item := items[i]
		result = append(result, bookingToProto(&item))
	}
	return result
}

func reviewToProto(r *model.Review) *pb.Review {
	return &pb.Review{
		Id:         r.ID,
		BookingId:  r.BookingID,
		PropertyId: r.PropertyID,
		AuthorId:   r.AuthorID,
		Rating:     int32(r.Rating),
		Text:       optionalString(r.Text),
		CreatedAt:  timestampFromTime(r.CreatedAt),
	}
}

func (s *BookingServer) publishEvent(eventType string, booking *model.Booking) {
	if s.publisher == nil {
		return
	}
	if err := s.publisher.PublishBookingEvent(messaging.BookingEvent{
		EventType:  eventType,
		BookingID:  booking.ID,
		PropertyID: booking.PropertyID,
		TenantID:   booking.TenantID,
		Status:     booking.Status,
		PriceTotal: booking.PriceTotal,
	}); err != nil {
		log.Printf("failed to publish event: %v", err)
	}
}

func (s *BookingServer) CreateBooking(ctx context.Context, req *pb.CreateBookingRequest) (*pb.Booking, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}
	if req.PropertyId == "" || req.StartDate == "" || req.EndDate == "" || req.GuestsCount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	start, err1 := time.Parse("2006-01-02", req.StartDate)
	end, err2 := time.Parse("2006-01-02", req.EndDate)
	if err1 != nil || err2 != nil || !end.After(start) {
		return nil, status.Error(codes.FailedPrecondition, "invalid dates: end_date must be after start_date")
	}

	property, err := s.propertyClient.GetByID(req.PropertyId)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check property")
	}
	if property == nil {
		return nil, status.Error(codes.NotFound, "property not found")
	}

	overlap, err := s.bookingRepo.HasOverlap(req.PropertyId, req.StartDate, req.EndDate, nil)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}
	if overlap {
		return nil, status.Error(codes.AlreadyExists, "dates overlap with existing booking")
	}

	days := int(end.Sub(start).Hours() / 24)
	priceTotal := property.PricePerNight * float64(days)

	booking, err := s.bookingRepo.Create(userID, model.CreateBookingRequest{
		PropertyID:  req.PropertyId,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		GuestsCount: int(req.GuestsCount),
	}, priceTotal)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create booking")
	}

	s.publishEvent("booking.created", booking)
	return bookingToProto(booking), nil
}

func (s *BookingServer) ListBookings(ctx context.Context, req *pb.ListBookingsRequest) (*pb.BookingListResponse, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	filter := model.BookingFilter{}
	if req.Status != nil {
		filter.Status = optionalString(req.Status)
	}
	limit, offset := normalizePagination(req.Limit, req.Offset)
	filter.Limit = limit
	filter.Offset = offset

	bookings, total, err := s.bookingRepo.ListByTenant(userID, filter)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &pb.BookingListResponse{
		Items: bookingsToProto(bookings),
		Pagination: &pb.Pagination{
			Limit:  int32(limit),
			Offset: int32(offset),
			Total:  int32(total),
		},
	}, nil
}

func (s *BookingServer) GetBooking(ctx context.Context, req *pb.GetBookingRequest) (*pb.Booking, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	booking, err := s.bookingRepo.GetByID(req.BookingId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "booking not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}

	property, _ := s.propertyClient.GetByID(booking.PropertyID)
	if booking.TenantID != userID && (property == nil || property.OwnerID != userID) {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	return bookingToProto(booking), nil
}

func (s *BookingServer) UpdateBookingStatus(ctx context.Context, req *pb.UpdateBookingStatusRequest) (*pb.Booking, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	if req.BookingId == "" || req.Status == "" {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	booking, err := s.bookingRepo.GetByID(req.BookingId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "booking not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}

	property, _ := s.propertyClient.GetByID(booking.PropertyID)

	switch req.Status {
	case "approved", "rejected", "completed":
		if property == nil || property.OwnerID != userID {
			return nil, status.Error(codes.PermissionDenied, "only the owner can perform this action")
		}
	case "cancelled":
		if booking.TenantID != userID && (property == nil || property.OwnerID != userID) {
			return nil, status.Error(codes.PermissionDenied, "access denied")
		}
	default:
		return nil, status.Error(codes.InvalidArgument, "invalid status")
	}

	updated, err := s.bookingRepo.UpdateStatus(req.BookingId, req.Status)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update status")
	}

	s.publishEvent("booking.status_changed", updated)
	return bookingToProto(updated), nil
}

func (s *BookingServer) ListOwnerBookings(ctx context.Context, req *pb.ListBookingsRequest) (*pb.BookingListResponse, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	filter := model.BookingFilter{}
	if req.Status != nil {
		filter.Status = optionalString(req.Status)
	}
	limit, offset := normalizePagination(req.Limit, req.Offset)
	filter.Limit = limit
	filter.Offset = offset

	propertyIDs, err := s.propertyClient.ListIDsByOwner(userID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch owner properties")
	}

	bookings, total, err := s.bookingRepo.ListByPropertyIDs(propertyIDs, filter)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &pb.BookingListResponse{
		Items: bookingsToProto(bookings),
		Pagination: &pb.Pagination{
			Limit:  int32(limit),
			Offset: int32(offset),
			Total:  int32(total),
		},
	}, nil
}

func (s *BookingServer) CreateReview(ctx context.Context, req *pb.CreateReviewRequest) (*pb.Review, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	if req.BookingId == "" || req.Rating < 1 || req.Rating > 5 {
		return nil, status.Error(codes.InvalidArgument, "invalid request")
	}

	booking, err := s.bookingRepo.GetByID(req.BookingId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "booking not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}

	if booking.TenantID != userID {
		return nil, status.Error(codes.PermissionDenied, "you can only review your own bookings")
	}

	if booking.Status != "completed" {
		return nil, status.Error(codes.FailedPrecondition, "booking must be completed before review")
	}

	exists, err := s.reviewRepo.ExistsByBooking(req.BookingId)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}
	if exists {
		return nil, status.Error(codes.AlreadyExists, "review already exists for this booking")
	}

	review, err := s.reviewRepo.Create(userID, model.CreateReviewRequest{
		BookingID: req.BookingId,
		Rating:    int(req.Rating),
		Text:      req.Text,
	}, booking.PropertyID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create review")
	}

	return reviewToProto(review), nil
}
