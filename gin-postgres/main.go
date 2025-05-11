package main

import (
	"user-api/config"
	"user-api/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	config.InitDB()

	// Create Gin router
	r := gin.Default()

	// Routes
	r.POST("/register", handlers.Register)

	// Start server
	r.Run(":3000")
}
