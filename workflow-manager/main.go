package main

import (
	"fmt"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// WorkflowData represents the DAG sent from ReactFlow
type WorkflowData struct {
	Nodes []map[string]interface{} `json:"nodes"`
	Edges []map[string]interface{} `json:"edges"`
}

func main() {
	// Initialize a new Gin router
	r := gin.Default()

	// Use default CORS middleware (Allows all origins, good for local development)
	r.Use(cors.Default())

	// Define the POST route for executing the workflow
	r.POST("/execute", func(c *gin.Context) {
		var data WorkflowData

		// Bind incoming JSON to our Go struct
		if err := c.ShouldBindJSON(&data); err != nil {
			// If JSON is invalid, return a 400 Bad Request automatically
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Process the workflow (your engine logic will go here)
		responseMsg := fmt.Sprintf("Gin Backend received workflow with %d nodes and %d edges!", len(data.Nodes), len(data.Edges))

		// Send a structured JSON response back to React
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": responseMsg,
		})
	})

	// Start the server (Gin defaults to port 8080)
	fmt.Println("🚀 Gin Backend running on http://localhost:8080")
	err := r.Run(":8080")
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
