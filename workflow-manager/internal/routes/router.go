package routes

import (
	"GoFlowWeb/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	r.POST("/execute", handlers.ExecuteWorkflow)
	r.GET("/ws/:id", handlers.WorkflowWS)
}