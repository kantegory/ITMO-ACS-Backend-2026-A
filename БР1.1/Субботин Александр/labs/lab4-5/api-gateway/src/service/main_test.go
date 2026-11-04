package main

import (
	"net/http"
	"testing"

	"google.golang.org/grpc/codes"
)

func TestGrpcStatusToHTTP(t *testing.T) {
	cases := map[codes.Code]int{
		codes.InvalidArgument:    http.StatusBadRequest,
		codes.Unauthenticated:    http.StatusUnauthorized,
		codes.PermissionDenied:   http.StatusForbidden,
		codes.NotFound:           http.StatusNotFound,
		codes.AlreadyExists:      http.StatusConflict,
		codes.FailedPrecondition: http.StatusUnprocessableEntity,
		codes.Unavailable:        http.StatusServiceUnavailable,
		codes.Unimplemented:      http.StatusNotImplemented,
		codes.Internal:           http.StatusInternalServerError,
		codes.DataLoss:           http.StatusInternalServerError,
	}
	for code, want := range cases {
		if got := grpcStatusToHTTP(code); got != want {
			t.Errorf("grpcStatusToHTTP(%s) = %d, want %d", code, got, want)
		}
	}
}

func TestIncomingHeaderMatcherPassesAuthorization(t *testing.T) {
	key, ok := incomingHeaderMatcher("Authorization")
	if !ok || key != "authorization" {
		t.Fatalf("got (%q, %v), want (\"authorization\", true)", key, ok)
	}
}
