package repositories

import (
	"GoFlowWeb/internal/entities"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(username, password, name, email string) (*entities.User, error) {
	user := entities.User{
		Username: username,
		Password: password,
		Name:     name,
		Email:    email,
	}
	if err := r.db.Create(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByUsername(username string) (*entities.User, error) {
	var user entities.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByID(id uint) (*entities.User, error) {
	var user entities.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdateProfile(id uint, name, email string) (*entities.User, error) {
	var user entities.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	user.Name = name
	user.Email = email
	if err := r.db.Save(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}