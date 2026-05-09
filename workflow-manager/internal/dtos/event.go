package dtos

// Node and Edge are the graph structures received from the frontend
// and passed through to the workflow engine.

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

// TaskLog is the event DTO streamed over channels/WebSocket during execution.
type TaskLog struct {
	NodeID string `json:"node_id"`
	Label  string `json:"label"`
	Status string `json:"status"`
	Output string `json:"output,omitempty"`
}

type WSEvent struct {
	Type string   `json:"type"` // "task_update" or "workflow_done"
	Log  *TaskLog `json:"log,omitempty"`
	// workflow_done fields
	Status  string `json:"status,omitempty"`
	Message string `json:"message,omitempty"`
}
