package grpcserver

import "testing"

func strPtr(s string) *string { return &s }

func TestCleanOptionalString(t *testing.T) {
	if cleanOptionalString(nil) != nil {
		t.Error("nil must stay nil")
	}
	if cleanOptionalString(strPtr("")) != nil {
		t.Error("empty string must become nil")
	}
	if v := cleanOptionalString(strPtr("Невский, 1")); v == nil || *v != "Невский, 1" {
		t.Error("non-empty value must be kept")
	}
}

func TestCleanTimeString(t *testing.T) {
	cases := []struct {
		in   *string
		keep bool
	}{
		{nil, false},
		{strPtr(""), false},
		{strPtr("14:00"), true},
		{strPtr("14:00:30"), true},
		{strPtr("2pm"), false},
		{strPtr("25:61"), false},
	}
	for _, c := range cases {
		got := cleanTimeString(c.in)
		if (got != nil) != c.keep {
			t.Errorf("cleanTimeString(%v) kept=%v, want %v", c.in, got != nil, c.keep)
		}
	}
}
