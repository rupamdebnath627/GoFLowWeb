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
	defer database.Close()

	handlers.InitHandlers(database)
	handlers.InitUserHandlers(database)

	r := gin.Default()
	r.Use(cors.Default())

	routes.SetupRouter(r)

	fmt.Println("🚀 Gin Backend running on http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		fmt.Println("Error starting server:", err)
	}
}