package repositories

import (
	"database/sql"
	"time"

	"GoFlowWeb/internal/models"
)

type WorkflowLog struct {
	ID         int64      `json:"id"`
	WorkflowID string     `json:"workflow_id"`
	Status     string     `json:"status"`
	Message    string     `json:"message"`
	CreatedAt  time.Time  `json:"created_at"`
	Tasks      []TaskLog  `json:"tasks,omitempty"`
}

type TaskLog struct {
	ID            int64  `json:"id"`
	WorkflowLogID int64  `json:"workflow_log_id"`
	NodeID        string `json:"node_id"`
	Label         string `json:"label"`
	Status        string `json:"status"`
	Output        string `json:"output"`
}

type LogRepository struct {
	db *sql.DB
}

func NewLogRepository(db *sql.DB) *LogRepository {
	return &LogRepository{db: db}
}

// SaveWorkflowLog saves a completed workflow execution and its task logs.
func (r *LogRepository) SaveWorkflowLog(workflowID, status, message string, taskLogs []models.TaskLog) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res, err := tx.Exec(
		"INSERT INTO workflow_logs (workflow_id, status, message) VALUES (?, ?, ?)",
		workflowID, status, message,
	)
	if err != nil {
		return err
	}

	wfLogID, err := res.LastInsertId()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare("INSERT INTO task_logs (workflow_log_id, node_id, label, status, output) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, tl := range taskLogs {
		if _, err := stmt.Exec(wfLogID, tl.NodeID, tl.Label, tl.Status, tl.Output); err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetAllWorkflowLogs returns all workflow logs (without task details).
func (r *LogRepository) GetAllWorkflowLogs() ([]WorkflowLog, error) {
	rows, err := r.db.Query("SELECT id, workflow_id, status, message, created_at FROM workflow_logs ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []WorkflowLog
	for rows.Next() {
		var wl WorkflowLog
		if err := rows.Scan(&wl.ID, &wl.WorkflowID, &wl.Status, &wl.Message, &wl.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, wl)
	}
	return logs, rows.Err()
}

// GetWorkflowLog returns a single workflow log with all its task logs.
func (r *LogRepository) GetWorkflowLog(id int64) (*WorkflowLog, error) {
	var wl WorkflowLog
	err := r.db.QueryRow(
		"SELECT id, workflow_id, status, message, created_at FROM workflow_logs WHERE id = ?", id,
	).Scan(&wl.ID, &wl.WorkflowID, &wl.Status, &wl.Message, &wl.CreatedAt)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(
		"SELECT id, workflow_log_id, node_id, label, status, output FROM task_logs WHERE workflow_log_id = ?", id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var tl TaskLog
		if err := rows.Scan(&tl.ID, &tl.WorkflowLogID, &tl.NodeID, &tl.Label, &tl.Status, &tl.Output); err != nil {
			return nil, err
		}
		wl.Tasks = append(wl.Tasks, tl)
	}

	return &wl, rows.Err()
}