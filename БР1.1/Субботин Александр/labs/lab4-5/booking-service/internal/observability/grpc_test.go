package observability

import (
	"context"
	"errors"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestIsServerError(t *testing.T) {
	cases := map[error]bool{
		status.Error(codes.Internal, "x"):        true,
		status.Error(codes.Unavailable, "x"):     true,
		errors.New("plain error"):                true, // не gRPC-статус → codes.Unknown
		status.Error(codes.NotFound, "x"):        false,
		status.Error(codes.InvalidArgument, "x"): false,
		status.Error(codes.Unauthenticated, "x"): false,
	}
	for err, want := range cases {
		if got := isServerError(err); got != want {
			t.Errorf("isServerError(%v) = %v, want %v", err, got, want)
		}
	}
}

func TestInterceptorRecoversPanic(t *testing.T) {
	interceptor := UnaryServerInterceptor()
	info := &grpc.UnaryServerInfo{FullMethod: "/test.Service/Panic"}
	_, err := interceptor(context.Background(), nil, info, func(context.Context, any) (any, error) {
		panic("boom")
	})
	if status.Code(err) != codes.Internal {
		t.Fatalf("expected codes.Internal after panic, got %v", err)
	}
}

func TestInterceptorPassesThrough(t *testing.T) {
	interceptor := UnaryServerInterceptor()
	info := &grpc.UnaryServerInfo{FullMethod: "/test.Service/Ok"}
	resp, err := interceptor(context.Background(), nil, info, func(context.Context, any) (any, error) {
		return "ok", nil
	})
	if err != nil || resp != "ok" {
		t.Fatalf("got (%v, %v), want (ok, nil)", resp, err)
	}
}
