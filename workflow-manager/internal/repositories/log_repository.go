package repositories

import (
	"GoFlowWeb/internal/dtos"
	"GoFlowWeb/internal/entities"

	"gorm.io/gorm"
)

type LogRepository struct {
	db *gorm.DB
}

func NewLogRepository(db *gorm.DB) *LogRepository {
	return &LogRepository{db: db}
}

// SaveWorkflowLog saves a completed workflow execution and its task logs.
func (r *LogRepository) SaveWorkflowLog(workflowID, status, message string, taskLogs []dtos.TaskLog) error {
	wl := entities.WorkflowLog{
		WorkflowID: workflowID,
		Status:     status,
		Message:    message,
	}
	for _, tl := range taskLogs {
		wl.Tasks = append(wl.Tasks, entities.WorkflowTaskLog{
			NodeID: tl.NodeID,
			Label:  tl.Label,
			Status: tl.Status,
			Output: tl.Output,
		})
	}
	return r.db.Create(&wl).Error
}

// GetAllWorkflowLogs returns all workflow logs (without task details).
func (r *LogRepository) GetAllWorkflowLogs() ([]entities.WorkflowLog, error) {
	var logs []entities.WorkflowLog
	if err := r.db.Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

// GetWorkflowLog returns a single workflow log with all its task logs.
func (r *LogRepository) GetWorkflowLog(id uint) (*entities.WorkflowLog, error) {
	var wl entities.WorkflowLog
	if err := r.db.Preload("Tasks").First(&wl, id).Error; err != nil {
		return nil, err
	}
	return &wl, nil
}
