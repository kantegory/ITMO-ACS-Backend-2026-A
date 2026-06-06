package client

import (
	"context"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"

	"github.com/ZZISST/rental-booking-service/internal/model"
	"github.com/ZZISST/rental-booking-service/internal/pb"
)

type PropertyClient struct {
	client pb.PropertyInternalClient
	conn   *grpc.ClientConn
}

func NewPropertyClient(grpcAddr string) (*PropertyClient, error) {
	conn, err := grpc.NewClient(grpcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &PropertyClient{
		client: pb.NewPropertyInternalClient(conn),
		conn:   conn,
	}, nil
}

func (c *PropertyClient) Close() error {
	return c.conn.Close()
}

func (c *PropertyClient) GetByID(propertyID string) (*model.Property, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := c.client.GetByID(ctx, &pb.GetPropertyRequest{PropertyId: propertyID})
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, nil
		}
		return nil, err
	}

	return &model.Property{
		ID:            resp.Id,
		OwnerID:       resp.OwnerId,
		PricePerNight: resp.PricePerNight,
	}, nil
}

func (c *PropertyClient) ListIDsByOwner(ownerID string) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := c.client.ListIDsByOwner(ctx, &pb.ListIDsByOwnerRequest{OwnerId: ownerID})
	if err != nil {
		return nil, err
	}

	return resp.PropertyIds, nil
}
