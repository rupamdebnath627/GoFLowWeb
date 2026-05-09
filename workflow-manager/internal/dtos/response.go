package dtos

import (
	"time"

	"GoFlowWeb/internal/entities"
)

type UserResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

func ToUserResponse(u *entities.User) UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Name:      u.Name,
		Email:     u.Email,
		CreatedAt: u.CreatedAt,
	}
}

type SubmitResponse struct {
	WorkflowID string `json:"workflow_id"`
	Status     string `json:"status"`
}

type WorkflowLogResponse struct {
	ID         uint                      `json:"id"`
	UserID     uint                      `json:"user_id"`
	WorkflowID string                    `json:"workflow_id"`
	Status     string                    `json:"status"`
	Message    string                    `json:"message"`
	CreatedAt  time.Time                 `json:"created_at"`
	Tasks      []WorkflowTaskLogResponse `json:"tasks,omitempty"`
}

type WorkflowTaskLogResponse struct {
	ID            uint   `json:"id"`
	WorkflowLogID uint   `json:"workflow_log_id"`
	NodeID        string `json:"node_id"`
	Label         string `json:"label"`
	Status        string `json:"status"`
	Output        string `json:"output"`
}

func ToWorkflowLogResponse(wl *entities.WorkflowLog) WorkflowLogResponse {
	resp := WorkflowLogResponse{
		ID:         wl.ID,
		UserID:     wl.UserID,
		WorkflowID: wl.WorkflowID,
		Status:     wl.Status,
		Message:    wl.Message,
		CreatedAt:  wl.CreatedAt,
	}
	for _, t := range wl.Tasks {
		resp.Tasks = append(resp.Tasks, WorkflowTaskLogResponse{
			ID:            t.ID,
			WorkflowLogID: t.WorkflowLogID,
			NodeID:        t.NodeID,
			Label:         t.Label,
			Status:        t.Status,
			Output:        t.Output,
		})
	}
	return resp
}

func ToWorkflowLogListResponse(logs []entities.WorkflowLog) []WorkflowLogResponse {
	result := make([]WorkflowLogResponse, len(logs))
	for i := range logs {
		result[i] = ToWorkflowLogResponse(&logs[i])
	}
	return result
}
