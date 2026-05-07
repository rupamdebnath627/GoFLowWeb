package handlers

import (
	"fmt"
	"net/http"

	"GoFlowWeb/internal/models"

	"github.com/gin-gonic/gin"
)

func ExecuteWorkflow(c *gin.Context) {
	var data models.WorkflowData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	responseMsg := fmt.Sprintf("Gin Backend received workflow with %d nodes and %d edges!", len(data.Nodes), len(data.Edges))
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": responseMsg,
	})
}