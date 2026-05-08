package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"GoFlowWeb/internal/models"
	"GoFlowWeb/internal/services"
	"GoFlowWeb/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var registry = services.NewRegistry()

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func ExecuteWorkflow(c *gin.Context) {
	var req models.WorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Nodes) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workflow must have at least one node"})
		return
	}

	hasStart, hasEnd := false, false
	var emptyCmd []string
	for _, n := range req.Nodes {
		if n.ID == "start" {
			hasStart = true
		}
		if n.ID == "end" {
			hasEnd = true
		}
		if n.ID != "start" && n.ID != "end" && strings.TrimSpace(n.Data.Command) == "" {
			emptyCmd = append(emptyCmd, n.Data.Label)
		}
	}
	if !hasStart || !hasEnd {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workflow must contain 'start' and 'end' nodes"})
		return
	}
	if len(emptyCmd) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Nodes missing command: %s", strings.Join(emptyCmd, ", "))})
		return
	}

	if errs := utils.ValidateWorkflow(req.Nodes, req.Edges); len(errs) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": strings.Join(errs, " | ")})
		return
	}

	eventCh, cancel, engine := services.StartWorkflow(req.Nodes, req.Edges)
	id := registry.Register(eventCh, cancel, engine)

	c.JSON(http.StatusAccepted, models.SubmitResponse{
		WorkflowID: id,
		Status:     "submitted",
	})
}

func CancelWorkflow(c *gin.Context) {
	id := c.Param("id")
	entry, ok := registry.Get(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}
	entry.Cancel()
	c.JSON(http.StatusOK, gin.H{"status": "cancelling", "workflow_id": id})
}

func PauseWorkflow(c *gin.Context) {
	id := c.Param("id")
	entry, ok := registry.Get(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}
	entry.Engine.Pause()
	c.JSON(http.StatusOK, gin.H{"status": "paused", "workflow_id": id})
}

func ResumeWorkflow(c *gin.Context) {
	id := c.Param("id")
	entry, ok := registry.Get(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}
	entry.Engine.Resume()
	c.JSON(http.StatusOK, gin.H{"status": "resumed", "workflow_id": id})
}

func WorkflowWS(c *gin.Context) {
	id := c.Param("id")

	entry, ok := registry.Claim(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found or already claimed"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Printf("WebSocket upgrade failed: %v\n", err)
		return
	}
	defer conn.Close()

	var logs []models.TaskLog
	cancelled := false
	writeFailed := false

	for log := range entry.EventCh {
		if log.Status == "cancelled" {
			cancelled = true
		}
		logs = append(logs, log)

		if writeFailed {
			continue // keep draining channel but don't write
		}

		evt := models.WSEvent{Type: "task_update", Log: &log}
		if err := conn.WriteJSON(evt); err != nil {
			fmt.Printf("WebSocket write failed: %v\n", err)
			writeFailed = true
		}
	}

	registry.Remove(id)

	if writeFailed {
		return // connection is broken, don't try final write
	}

	status := "success"
	message := fmt.Sprintf("Workflow completed: %d tasks", len(logs))

	if cancelled {
		status = "cancelled"
		message = "Workflow was cancelled by user"
	} else {
		for _, log := range logs {
			if log.Status == "failed" || log.Status == "skipped" || log.Status == "error" {
				status = "failed"
				message = "Workflow failed: check task logs for details"
				break
			}
		}
	}

	done := models.WSEvent{
		Type:    "workflow_done",
		Status:  status,
		Message: message,
	}
	if err := conn.WriteJSON(done); err != nil {
		fmt.Printf("WebSocket final write failed: %v\n", err)
	}
}