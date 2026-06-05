package database

import (
	"errors"
	"fmt"
	"time"

	"recipehub/internal/infrastructure/database/model"

	"gorm.io/gorm"
)

// ErrMissingUsers означает, что UsersByIDsInOrder не нашёл хотя бы один запрошенный id.
var ErrMissingUsers = errors.New("users not found for ids")

// UsersByIDsInOrder загружает пользователей по списку id и возвращает их в том же порядке. Ошибка, если хотя бы один id отсутствует.
func (s *Store) UsersByIDsInOrder(ids []uint64) ([]model.User, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var rows []model.User
	if err := s.DB.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	by := make(map[uint64]model.User, len(rows))
	for _, u := range rows {
		by[u.ID] = u
	}
	out := make([]model.User, 0, len(ids))
	for _, id := range ids {
		u, ok := by[id]
		if !ok {
			return nil, fmt.Errorf("%w: missing id=%d", ErrMissingUsers, id)
		}
		out = append(out, u)
	}
	return out, nil
}

func (s *Store) UserByID(id uint64) (model.User, error) {
	var u model.User
	err := s.DB.First(&u, id).Error
	return u, err
}

func (s *Store) UserByEmail(email string) (model.User, error) {
	var u model.User
	err := s.DB.Where("email = ?", email).First(&u).Error
	return u, err
}

func (s *Store) CreateUser(u *model.User) error {
	return s.DB.Create(u).Error
}

func (s *Store) UpdateUser(u *model.User) error {
	return s.DB.Save(u).Error
}

func (s *Store) CountUsersByEmail(email string) (int64, error) {
	var c int64
	err := s.DB.Model(&model.User{}).Where("email = ?", email).Count(&c).Error
	return c, err
}

func (s *Store) CountUsersByUsername(username string) (int64, error) {
	var c int64
	err := s.DB.Model(&model.User{}).Where("username = ?", username).Count(&c).Error
	return c, err
}

func (s *Store) DeleteRefreshByHash(hash string) error {
	return s.DB.Where("token_hash = ?", hash).Delete(&model.RefreshToken{}).Error
}

func (s *Store) RefreshByHash(hash string) (model.RefreshToken, error) {
	var rt model.RefreshToken
	err := s.DB.Where("token_hash = ?", hash).First(&rt).Error
	return rt, err
}

func (s *Store) IsFollow(follower, following uint64) bool {
	var c int64
	_ = s.DB.Model(&model.Follow{}).
		Where("follower_id = ? AND following_id = ?", follower, following).
		Count(&c).Error
	return c > 0
}

func (s *Store) FollowUser(followerID, followingID uint64) error {
	f := model.Follow{
		FollowerID:  followerID,
		FollowingID: followingID,
		CreatedAt:   time.Now().UTC(),
	}
	return s.DB.Create(&f).Error
}

func (s *Store) UnfollowUser(followerID, followingID uint64) error {
	return s.DB.Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&model.Follow{}).Error
}

func (s *Store) ListFollowers(userID uint64, limit, offset int) ([]model.Follow, int64, error) {
	var total int64
	if err := s.DB.Model(&model.Follow{}).Where("following_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []model.Follow
	err := s.DB.Where("following_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&rows).Error
	return rows, total, err
}

func (s *Store) ListFollowing(userID uint64, limit, offset int) ([]model.Follow, int64, error) {
	var total int64
	if err := s.DB.Model(&model.Follow{}).Where("follower_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []model.Follow
	err := s.DB.Where("follower_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&rows).Error
	return rows, total, err
}

func IsRecordNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
