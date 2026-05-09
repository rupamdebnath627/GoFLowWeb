package routes

import (
	"GoFlowWeb/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	r.POST("/login", handlers.Login)
	r.POST("/signup", handlers.Signup)
	r.GET("/users/:id", handlers.GetProfile)
	r.PUT("/users/:id", handlers.UpdateProfile)

	r.POST("/execute", handlers.ExecuteWorkflow)
	r.POST("/cancel/:id", handlers.CancelWorkflow)
	r.POST("/pause/:id", handlers.PauseWorkflow)
	r.POST("/resume/:id", handlers.ResumeWorkflow)
	r.GET("/ws/:id", handlers.WorkflowWS)

	r.GET("/logs", handlers.GetWorkflowLogs)
	r.GET("/logs/:id", handlers.GetWorkflowLog)
}