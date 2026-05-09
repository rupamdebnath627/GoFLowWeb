package main

import (
	"fmt"
	"log"

	"GoFlowWeb/internal/db"
	"GoFlowWeb/internal/handlers"
	"GoFlowWeb/internal/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database, err := db.Open()
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	handlers.InitHandlers(database)
	handlers.InitUserHandlers(database)
	handlers.InitSavedWorkflowHandlers(database)

	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "X-User-ID"}
	r.Use(cors.New(config))

	routes.SetupRouter(r)

	fmt.Println("🚀 Gin Backend running on http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
