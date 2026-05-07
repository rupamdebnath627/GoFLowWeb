package main

import (
	"fmt"

	"GoFlowWeb/internal/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.Use(cors.Default())

	routes.SetupRouter(r)

	fmt.Println("🚀 Gin Backend running on http://localhost:8080")
	err := r.Run(":8080")
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}