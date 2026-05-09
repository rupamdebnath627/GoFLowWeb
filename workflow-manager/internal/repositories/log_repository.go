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
func (r *LogRepository) SaveWorkflowLog(userID uint, workflowID, status, message string, taskLogs []dtos.TaskLog) error {
	wl := entities.WorkflowLog{
		UserID:     userID,
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

// GetWorkflowLogsByUser returns all workflow logs for a specific user.
func (r *LogRepository) GetWorkflowLogsByUser(userID uint) ([]entities.WorkflowLog, error) {
	var logs []entities.WorkflowLog
	if err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

// GetWorkflowLog returns a single workflow log with all its task logs.
// Returns nil if the log doesn't belong to the given user.
func (r *LogRepository) GetWorkflowLog(id, userID uint) (*entities.WorkflowLog, error) {
	var wl entities.WorkflowLog
	if err := r.db.Preload("Tasks").Where("id = ? AND user_id = ?", id, userID).First(&wl).Error; err != nil {
		return nil, err
	}
	return &wl, nil
}