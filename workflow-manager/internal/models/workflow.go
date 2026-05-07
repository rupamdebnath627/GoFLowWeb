package models

type Node struct {
	ID   string   `json:"id"`
	Data NodeData `json:"data"`
}

type NodeData struct {
	Label string `json:"label"`
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
}

type WorkflowResponse struct {
	Status  string    `json:"status"`
	Message string    `json:"message"`
	Logs    []TaskLog `json:"logs"`
}