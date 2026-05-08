package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"sync"

	"GoFlowWeb/internal/models"
	"GoFlowWeb/internal/services"
	"GoFlowWeb/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// In-memory store of running workflows
var (
	workflows   = make(map[string]<-chan models.TaskLog)
	workflowsMu sync.Mutex
	workflowSeq int
)

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

	if errs := utils.ValidateWorkflow(req.Nodes, req.Edges); len(errs) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": strings.Join(errs, " | "),
		})
		return
	}

	// Start workflow asynchronously
	eventCh := services.StartWorkflow(req.Nodes, req.Edges)

	workflowsMu.Lock()
	workflowSeq++
	id := fmt.Sprintf("wf-%d", workflowSeq)
	workflows[id] = eventCh
	workflowsMu.Unlock()

	c.JSON(http.StatusAccepted, models.SubmitResponse{
		WorkflowID: id,
		Status:     "submitted",
	})
}

func WorkflowWS(c *gin.Context) {
	id := c.Param("id")

	workflowsMu.Lock()
	eventCh, exists := workflows[id]
	if exists {
		delete(workflows, id) // consume once
	}
	workflowsMu.Unlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Printf("WebSocket upgrade failed: %v\n", err)
		return
	}
	defer conn.Close()

	var logs []models.TaskLog
	for log := range eventCh {
		logs = append(logs, log)
		evt := models.WSEvent{
			Type: "task_update",
			Log:  &log,
		}
		if err := conn.WriteJSON(evt); err != nil {
			fmt.Printf("WebSocket write failed: %v\n", err)
			return
		}
	}

	// Determine final status
	status := "success"
	message := fmt.Sprintf("Workflow completed: %d tasks", len(logs))
	for _, log := range logs {
		if log.Status == "failed" || log.Status == "skipped" || log.Status == "error" {
			status = "failed"
			message = fmt.Sprintf("Workflow failed: check task logs for details")
			break
		}
	}

	done := models.WSEvent{
		Type:    "workflow_done",
		Status:  status,
		Message: message,
	}
	conn.WriteJSON(done)
}