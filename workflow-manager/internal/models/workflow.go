package models

type Node struct {
	ID   string   `json:"id"`
	Data NodeData `json:"data"`
}

type NodeData struct {
	Label    string `json:"label"`
	Command  string `json:"command"`
	Optional bool   `json:"optional"`
}

type Edge struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
}

type WorkflowRequest struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

type TaskLog struct {
	NodeID string `json:"node_id"`
	Label  string `json:"label"`
	Status string `json:"status"`
	Output string `json:"output,omitempty"`
}

type WorkflowResponse struct {
	Status  string    `json:"status"`
	Message string    `json:"message"`
	Logs    []TaskLog `json:"logs,omitempty"`
}

type SubmitResponse struct {
	WorkflowID string `json:"workflow_id"`
	Status     string `json:"status"`
}

type WSEvent struct {
	Type string  `json:"type"` // "task_update" or "workflow_done"
	Log  *TaskLog `json:"log,omitempty"`
	// workflow_done fields
	Status  string `json:"status,omitempty"`
	Message string `json:"message,omitempty"`
}