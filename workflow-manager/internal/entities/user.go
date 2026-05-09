package entities

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null"`
	Password string `gorm:"not null"`
	Name     string `gorm:"default:''"`
	Email    string `gorm:"default:''"`
}