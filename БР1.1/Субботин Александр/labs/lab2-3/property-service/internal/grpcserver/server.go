package grpcserver

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/ZZISST/rental-property-service/internal/model"
	internalpb "github.com/ZZISST/rental-property-service/internal/pb"
	pb "github.com/ZZISST/rental-property-service/internal/pb/propertypb"
	"github.com/ZZISST/rental-property-service/internal/repository"
)

type PropertyServer struct {
	internalpb.UnimplementedPropertyInternalServer
	pb.UnimplementedPropertyServiceServer
	propertyRepo *repository.PropertyRepository
	favoriteRepo *repository.FavoriteRepository
	jwtSecret    string
}

func NewPropertyServer(propertyRepo *repository.PropertyRepository, favoriteRepo *repository.FavoriteRepository, jwtSecret string) *PropertyServer {
	return &PropertyServer{
		propertyRepo: propertyRepo,
		favoriteRepo: favoriteRepo,
		jwtSecret:    jwtSecret,
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

func intPtrFromInt32(v *int32) *int {
	if v == nil {
		return nil
	}
	value := int(*v)
	return &value
}

func int32PtrFromInt(v *int) *int32 {
	if v == nil {
		return nil
	}
	value := int32(*v)
	return &value
}

func float64PtrFromFloat64(v *float64) *float64 {
	if v == nil {
		return nil
	}
	value := *v
	return &value
}

func timestampFromTime(t time.Time) *timestamppb.Timestamp {
	return timestamppb.New(t)
}

func toProperty(p *model.Property) *pb.Property {
	return &pb.Property{
		Id:            p.ID,
		OwnerId:       p.OwnerID,
		Title:         p.Title,
		Description:   p.Description,
		PropertyType:  p.PropertyType,
		PricePerNight: p.PricePerNight,
		Currency:      p.Currency,
		City:          p.City,
		Address:       p.Address,
		Lat:           p.Lat,
		Lon:           p.Lon,
		Rooms:         int32PtrFromInt(p.Rooms),
		Beds:          int32PtrFromInt(p.Beds),
		MaxGuests:     int32(p.MaxGuests),
		AreaM2:        p.AreaM2,
		CheckInTime:   p.CheckInTime,
		CheckOutTime:  p.CheckOutTime,
		Rules:         p.Rules,
		Status:        p.Status,
		CreatedAt:     timestampFromTime(p.CreatedAt),
		UpdatedAt:     timestampFromTime(p.UpdatedAt),
	}
}

func toPropertyList(items []model.Property) []*pb.Property {
	result := make([]*pb.Property, 0, len(items))
	for i := range items {
		item := items[i]
		result = append(result, toProperty(&item))
	}
	return result
}

func (s *PropertyServer) GetByID(ctx context.Context, req *internalpb.GetPropertyRequest) (*internalpb.PropertyResponse, error) {
	property, err := s.propertyRepo.GetByID(req.PropertyId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "property not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &internalpb.PropertyResponse{
		Id:            property.ID,
		OwnerId:       property.OwnerID,
		PricePerNight: property.PricePerNight,
		Title:         property.Title,
		Status:        property.Status,
	}, nil
}

func (s *PropertyServer) ListIDsByOwner(ctx context.Context, req *internalpb.ListIDsByOwnerRequest) (*internalpb.ListIDsByOwnerResponse, error) {
	if req.OwnerId == "" {
		return nil, status.Error(codes.InvalidArgument, "owner_id is required")
	}

	ids, err := s.propertyRepo.ListIDsByOwner(req.OwnerId)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &internalpb.ListIDsByOwnerResponse{PropertyIds: ids}, nil
}

func (s *PropertyServer) ListProperties(ctx context.Context, req *pb.ListPropertiesRequest) (*pb.PropertyListResponse, error) {
	limit, offset := normalizePagination(req.Limit, req.Offset)
	filter := model.PropertyFilter{
		Limit:  limit,
		Offset: offset,
	}
	if req.City != nil {
		filter.City = req.City
	}
	if req.PropertyType != nil {
		filter.PropertyType = req.PropertyType
	}
	if req.PriceMin != nil {
		filter.PriceMin = req.PriceMin
	}
	if req.PriceMax != nil {
		filter.PriceMax = req.PriceMax
	}
	if req.Rooms != nil {
		filter.Rooms = intPtrFromInt32(req.Rooms)
	}
	if req.MaxGuests != nil {
		value := int(*req.MaxGuests)
		filter.MaxGuests = &value
	}

	properties, total, err := s.propertyRepo.List(filter)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &pb.PropertyListResponse{
		Items: toPropertyList(properties),
		Pagination: &pb.Pagination{
			Limit:  int32(limit),
			Offset: int32(offset),
			Total:  int32(total),
		},
	}, nil
}

func (s *PropertyServer) GetProperty(ctx context.Context, req *pb.GetPropertyRequest) (*pb.Property, error) {
	property, err := s.propertyRepo.GetByID(req.PropertyId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "property not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}

	return toProperty(property), nil
}

func (s *PropertyServer) CreateProperty(ctx context.Context, req *pb.CreatePropertyRequest) (*pb.Property, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	property, err := s.propertyRepo.Create(userID, model.CreatePropertyRequest{
		Title:         req.Title,
		Description:   req.Description,
		PropertyType:  req.PropertyType,
		PricePerNight: req.PricePerNight,
		City:          req.City,
		MaxGuests:     int(req.MaxGuests),
		Address:       req.Address,
		Rooms:         intPtrFromInt32(req.Rooms),
		Beds:          intPtrFromInt32(req.Beds),
		AreaM2:        float64PtrFromFloat64(req.AreaM2),
		CheckInTime:   req.CheckInTime,
		CheckOutTime:  req.CheckOutTime,
		Rules:         req.Rules,
		AmenityIDs:    req.AmenityIds,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create property")
	}

	return toProperty(property), nil
}

func (s *PropertyServer) UpdateProperty(ctx context.Context, req *pb.UpdatePropertyRequest) (*pb.Property, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	existing, err := s.propertyRepo.GetByID(req.PropertyId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "property not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}
	if existing.OwnerID != userID {
		return nil, status.Error(codes.PermissionDenied, "you are not the owner")
	}

	updated, err := s.propertyRepo.Update(req.PropertyId, model.UpdatePropertyRequest{
		Title:         req.Title,
		Description:   req.Description,
		PricePerNight: req.PricePerNight,
		City:          req.City,
		MaxGuests: func() *int {
			if req.MaxGuests == nil {
				return nil
			}
			value := int(*req.MaxGuests)
			return &value
		}(),
		Rooms: func() *int {
			if req.Rooms == nil {
				return nil
			}
			value := int(*req.Rooms)
			return &value
		}(),
		Status: func() *string {
			if req.Status == nil {
				return nil
			}
			value := *req.Status
			return &value
		}(),
		AmenityIDs: req.AmenityIds,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update property")
	}

	return toProperty(updated), nil
}

func (s *PropertyServer) DeleteProperty(ctx context.Context, req *pb.DeletePropertyRequest) (*emptypb.Empty, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	existing, err := s.propertyRepo.GetByID(req.PropertyId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "property not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}
	if existing.OwnerID != userID {
		return nil, status.Error(codes.PermissionDenied, "you are not the owner")
	}

	if err := s.propertyRepo.Delete(req.PropertyId); err != nil {
		return nil, status.Error(codes.Internal, "failed to delete property")
	}

	return &emptypb.Empty{}, nil
}

func (s *PropertyServer) ListMyProperties(ctx context.Context, req *pb.ListMyPropertiesRequest) (*pb.PropertyListResponse, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	limit, offset := normalizePagination(req.Limit, req.Offset)
	properties, total, err := s.propertyRepo.ListByOwner(userID, limit, offset)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &pb.PropertyListResponse{
		Items: toPropertyList(properties),
		Pagination: &pb.Pagination{
			Limit:  int32(limit),
			Offset: int32(offset),
			Total:  int32(total),
		},
	}, nil
}

func (s *PropertyServer) ListFavorites(ctx context.Context, req *emptypb.Empty) (*pb.FavoriteListResponse, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	properties, err := s.favoriteRepo.List(userID)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &pb.FavoriteListResponse{Items: toPropertyList(properties)}, nil
}

func (s *PropertyServer) AddFavorite(ctx context.Context, req *pb.AddFavoriteRequest) (*pb.Favorite, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	if _, err := s.propertyRepo.GetByID(req.PropertyId); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "property not found")
		}
		return nil, status.Error(codes.Internal, "internal error")
	}

	exists, err := s.favoriteRepo.Exists(userID, req.PropertyId)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}
	if exists {
		return nil, status.Error(codes.AlreadyExists, "already in favorites")
	}

	fav, err := s.favoriteRepo.Add(userID, req.PropertyId)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to add to favorites")
	}

	return &pb.Favorite{
		UserId:     fav.UserID,
		PropertyId: fav.PropertyID,
		CreatedAt:  timestampFromTime(fav.CreatedAt),
	}, nil
}

func (s *PropertyServer) RemoveFavorite(ctx context.Context, req *pb.RemoveFavoriteRequest) (*emptypb.Empty, error) {
	userID, err := userIDFromContext(ctx, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	if err := s.favoriteRepo.Remove(userID, req.PropertyId); err != nil {
		return nil, status.Error(codes.Internal, "failed to remove from favorites")
	}

	return &emptypb.Empty{}, nil
}
