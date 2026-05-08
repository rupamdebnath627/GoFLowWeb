package routes

import (
	"GoFlowWeb/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	r.POST("/execute", handlers.ExecuteWorkflow)
	r.POST("/cancel/:id", handlers.CancelWorkflow)
	r.POST("/pause/:id", handlers.PauseWorkflow)
	r.POST("/resume/:id", handlers.ResumeWorkflow)
	r.GET("/ws/:id", handlers.WorkflowWS)

	r.GET("/logs", handlers.GetWorkflowLogs)
	r.GET("/logs/:id", handlers.GetWorkflowLog)
}