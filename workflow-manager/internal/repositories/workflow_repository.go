package repositories

import (
	"GoFlowWeb/internal/entities"

	"gorm.io/gorm"
)

type WorkflowRepository struct {
	db *gorm.DB
}

func NewWorkflowRepository(db *gorm.DB) *WorkflowRepository {
	return &WorkflowRepository{db: db}
}

func (r *WorkflowRepository) Create(workflow *entities.Workflow) error {
	return r.db.Create(workflow).Error
}

func (r *WorkflowRepository) GetByUser(userID uint) ([]entities.Workflow, error) {
	var workflows []entities.Workflow
	if err := r.db.Where("user_id = ?", userID).Order("updated_at DESC").Find(&workflows).Error; err != nil {
		return nil, err
	}
	return workflows, nil
}

func (r *WorkflowRepository) GetByID(id, userID uint) (*entities.Workflow, error) {
	var workflow entities.Workflow
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&workflow).Error; err != nil {
		return nil, err
	}
	return &workflow, nil
}

func (r *WorkflowRepository) Update(workflow *entities.Workflow) error {
	return r.db.Save(workflow).Error
}

func (r *WorkflowRepository) Delete(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&entities.Workflow{}).Error
}