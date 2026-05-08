package handlers

import (
	"context"
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

type workflowEntry struct {
	eventCh <-chan models.TaskLog
	cancel  context.CancelFunc
	engine  *services.WorkflowEngine
	claimed bool
}

var (
	workflows   = make(map[string]*workflowEntry)
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

	eventCh, cancel, engine := services.StartWorkflow(req.Nodes, req.Edges)

	workflowsMu.Lock()
	workflowSeq++
	id := fmt.Sprintf("wf-%d", workflowSeq)
	workflows[id] = &workflowEntry{eventCh: eventCh, cancel: cancel, engine: engine}
	workflowsMu.Unlock()

	c.JSON(http.StatusAccepted, models.SubmitResponse{
		WorkflowID: id,
		Status:     "submitted",
	})
}

func CancelWorkflow(c *gin.Context) {
	id := c.Param("id")

	workflowsMu.Lock()
	entry, exists := workflows[id]
	workflowsMu.Unlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}

	entry.cancel()
	c.JSON(http.StatusOK, gin.H{"status": "cancelling", "workflow_id": id})
}

func PauseWorkflow(c *gin.Context) {
	id := c.Param("id")

	workflowsMu.Lock()
	entry, exists := workflows[id]
	workflowsMu.Unlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}

	entry.engine.Pause()
	c.JSON(http.StatusOK, gin.H{"status": "paused", "workflow_id": id})
}

func ResumeWorkflow(c *gin.Context) {
	id := c.Param("id")

	workflowsMu.Lock()
	entry, exists := workflows[id]
	workflowsMu.Unlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}

	entry.engine.Resume()
	c.JSON(http.StatusOK, gin.H{"status": "resumed", "workflow_id": id})
}

func WorkflowWS(c *gin.Context) {
	id := c.Param("id")

	workflowsMu.Lock()
	entry, exists := workflows[id]
	if exists && entry.claimed {
		exists = false
	}
	if exists {
		entry.claimed = true
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
	cancelled := false
	for log := range entry.eventCh {
		if log.Status == "cancelled" {
			cancelled = true
		}
		logs = append(logs, log)
		evt := models.WSEvent{
			Type: "task_update",
			Log:  &log,
		}
		if err := conn.WriteJSON(evt); err != nil {
			fmt.Printf("WebSocket write failed: %v\n", err)
			break
		}
	}

	workflowsMu.Lock()
	delete(workflows, id)
	workflowsMu.Unlock()

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
	conn.WriteJSON(done)
}