package entities

import "gorm.io/gorm"

type Workflow struct {
	gorm.Model
	UserID uint   `gorm:"not null;index"`
	Name   string `gorm:"not null"`
	Nodes  string `gorm:"type:text;not null"`
	Edges  string `gorm:"type:text;not null"`
	User   User   `gorm:"foreignKey:UserID"`
}