package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"GoFlowWeb/internal/models"
	"GoFlowWeb/internal/services"
	"GoFlowWeb/internal/utils"

	"github.com/gin-gonic/gin"
)

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

	logs := services.ExecuteWorkflow(req.Nodes, req.Edges)

	c.JSON(http.StatusOK, models.WorkflowResponse{
		Status:  "success",
		Message: fmt.Sprintf("Workflow executed: %d nodes, %d edges", len(req.Nodes), len(req.Edges)),
		Logs:    logs,
	})
}
