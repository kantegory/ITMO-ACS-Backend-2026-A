package authctx

import "context"

type ctxKey int

const userIDKey ctxKey = 1

func WithUserID(ctx context.Context, id uint64) context.Context {
	return context.WithValue(ctx, userIDKey, id)
}

func UserID(ctx context.Context) (uint64, bool) {
	v, ok := ctx.Value(userIDKey).(uint64)
	return v, ok
}
