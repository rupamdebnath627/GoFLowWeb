package dtos

import "encoding/json"

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type SignupRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name"`
	Email    string `json:"email"`
}

type UpdateProfileRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type WorkflowRequest struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

type SaveWorkflowRequest struct {
	Name  string          `json:"name" binding:"required"`
	Nodes json.RawMessage `json:"nodes" binding:"required"`
	Edges json.RawMessage `json:"edges" binding:"required"`
}

type UpdateWorkflowRequest struct {
	Name  string          `json:"name"`
	Nodes json.RawMessage `json:"nodes"`
	Edges json.RawMessage `json:"edges"`
}
