package identity

import (
	"time"

	identitydomain "recipehub/internal/domain/identity"
	identityusecase "recipehub/internal/usecase/identity"
)

type registerRequest struct {
	Email       string `json:"email"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type patchMeRequest struct {
	DisplayName *string `json:"display_name"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatar_url"`
}

type tokenPairResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

type userShortResponse struct {
	ID          uint64  `json:"id"`
	Username    string  `json:"username"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

type userProfileResponse struct {
	ID             uint64    `json:"id"`
	Email          string    `json:"email"`
	Username       string    `json:"username"`
	DisplayName    string    `json:"display_name"`
	Bio            *string   `json:"bio"`
	AvatarURL      *string   `json:"avatar_url"`
	FollowersCount int64     `json:"followers_count"`
	FollowingCount int64     `json:"following_count"`
	RecipesCount   int64     `json:"recipes_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type followUserResponse struct {
	User      userShortResponse `json:"user"`
	CreatedAt time.Time         `json:"created_at"`
}

type followingResponse struct {
	Following bool `json:"following"`
}

type existsResponse struct {
	Exists bool `json:"exists"`
}

type batchUsersRequest struct {
	IDs []uint64 `json:"ids"`
}

type batchUsersResponse struct {
	Users []userShortResponse `json:"users"`
}

func toRegisterInput(req registerRequest) identityusecase.RegisterInput {
	return identityusecase.RegisterInput{
		Email:       req.Email,
		Username:    req.Username,
		Password:    req.Password,
		DisplayName: req.DisplayName,
	}
}

func toLoginInput(req loginRequest) identityusecase.LoginInput {
	return identityusecase.LoginInput{Email: req.Email, Password: req.Password}
}

func toPatchInput(req patchMeRequest) identityusecase.PatchProfileInput {
	return identityusecase.PatchProfileInput{
		DisplayName: req.DisplayName,
		Bio:         req.Bio,
		AvatarURL:   req.AvatarURL,
	}
}

func toTokenPairResponse(pair identityusecase.TokenPair) tokenPairResponse {
	return tokenPairResponse{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
	}
}

func toUserShortResponse(user identitydomain.UserShort) userShortResponse {
	return userShortResponse{
		ID:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		AvatarURL:   user.AvatarURL,
	}
}

func toUserProfileResponse(user identitydomain.User, followersCount, followingCount int64) userProfileResponse {
	return userProfileResponse{
		ID:             user.ID,
		Email:          user.Email,
		Username:       user.Username,
		DisplayName:    user.DisplayName,
		Bio:            user.Bio,
		AvatarURL:      user.AvatarURL,
		FollowersCount: followersCount,
		FollowingCount: followingCount,
		RecipesCount:   0,
		CreatedAt:      user.CreatedAt,
	}
}

func toFollowUserResponse(item identitydomain.FollowUser) followUserResponse {
	return followUserResponse{
		User:      toUserShortResponse(item.User),
		CreatedAt: item.CreatedAt,
	}
}
