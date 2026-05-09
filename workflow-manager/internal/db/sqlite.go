package db

import (
	"fmt"
	"os"
	"path/filepath"

	"GoFlowWeb/internal/entities"

	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Open() (*gorm.DB, error) {
	dataDir := "data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "goflowweb.db")
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := db.AutoMigrate(&entities.User{}, &entities.Workflow{}, &entities.WorkflowLog{}, &entities.WorkflowTaskLog{}); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	if err := seedDefaultUser(db); err != nil {
		return nil, fmt.Errorf("seed default user: %w", err)
	}

	return db, nil
}

func seedDefaultUser(db *gorm.DB) error {
	var count int64
	db.Model(&entities.User{}).Where("username = ?", "admin").Count(&count)

	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		return db.Create(&entities.User{
			Username: "admin",
			Password: string(hashedPassword),
			Name:     "Admin",
			Email:    "admin@goflowweb.local",
		}).Error
	}

	return nil
}
