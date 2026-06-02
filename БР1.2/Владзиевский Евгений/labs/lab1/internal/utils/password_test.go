package utils

import (
	"testing"
)

func TestHashPassword(t *testing.T) {
	password := "testpassword123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if hash == "" {
		t.Error("HashPassword returned empty hash")
	}
	// Ensure hash is different from password
	if hash == password {
		t.Error("HashPassword returned plaintext password")
	}
}

func TestCheckPasswordHash(t *testing.T) {
	password := "testpassword123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	// Correct password should match
	if !CheckPasswordHash(password, hash) {
		t.Error("CheckPasswordHash failed for correct password")
	}
	// Incorrect password should not match
	if CheckPasswordHash("wrongpassword", hash) {
		t.Error("CheckPasswordHash incorrectly matched wrong password")
	}
	// Empty hash should not panic
	if CheckPasswordHash(password, "") {
		t.Error("CheckPasswordHash matched empty hash")
	}
}

func TestCheckPasswordHash_InvalidHash(t *testing.T) {
	// This test ensures that invalid hash doesn't crash
	// bcrypt.CompareHashAndPassword will return an error
	if CheckPasswordHash("any", "invalidhash") {
		t.Error("CheckPasswordHash matched invalid hash")
	}
}
