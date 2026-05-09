package entities

import "gorm.io/gorm"

type WorkflowLog struct {
	gorm.Model
	WorkflowID string            `gorm:"not null"`
	Status     string            `gorm:"not null"`
	Message    string            `gorm:"not null"`
	Tasks      []WorkflowTaskLog `gorm:"foreignKey:WorkflowLogID"`
}

type WorkflowTaskLog struct {
	gorm.Model
	WorkflowLogID uint   `gorm:"not null"`
	NodeID        string `gorm:"not null"`
	Label         string `gorm:"not null"`
	Status        string `gorm:"not null"`
	Output        string `gorm:"not null;default:''"`
}