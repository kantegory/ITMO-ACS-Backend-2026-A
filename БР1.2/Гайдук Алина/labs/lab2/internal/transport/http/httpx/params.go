package httpx

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

func UintPath(r *http.Request, name string) (uint64, bool) {
	s := strings.TrimSpace(r.PathValue(name))
	if s == "" {
		return 0, false
	}
	n, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return 0, false
	}
	return n, true
}

func ClampLimitOffset(r *http.Request, defaultLimit int) (limit, offset int) {
	limit = defaultLimit
	offset = 0
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			offset = n
		}
	}
	if limit < 1 {
		limit = 1
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}

// ParseCommaUintsStrict отклоняет пустые элементы между запятыми и неверные целые (по контракту OpenAPI код 400 BAD_REQUEST).
func ParseCommaUintsStrict(s string) ([]uint64, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	raw := strings.Split(s, ",")
	out := make([]uint64, 0, len(raw))
	for _, p := range raw {
		p = strings.TrimSpace(p)
		if p == "" {
			return nil, fmt.Errorf("empty token")
		}
		n, err := strconv.ParseUint(p, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid uint: %q", p)
		}
		out = append(out, n)
	}
	return DedupPreserveOrderUints(out), nil
}

// DedupPreserveOrderUints убирает повторяющиеся значения, порядок оставляет как у первых вхождений.
func DedupPreserveOrderUints(in []uint64) []uint64 {
	if len(in) <= 1 {
		return in
	}
	seen := make(map[uint64]struct{}, len(in))
	out := make([]uint64, 0, len(in))
	for _, v := range in {
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}
