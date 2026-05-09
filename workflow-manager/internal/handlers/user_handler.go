package handlers

import (
	"net/http"
	"strconv"

	"GoFlowWeb/internal/dtos"
	"GoFlowWeb/internal/repositories"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var userRepo *repositories.UserRepository

func InitUserHandlers(db *gorm.DB) {
	userRepo = repositories.NewUserRepository(db)
}

func Login(c *gin.Context) {
	var req dtos.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}

	user, err := userRepo.GetByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	if user.Password != req.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	c.JSON(http.StatusOK, dtos.ToUserResponse(user))
}

func Signup(c *gin.Context) {
	var req dtos.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}

	if len(req.Username) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username must be at least 3 characters"})
		return
	}
	if len(req.Password) < 4 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 4 characters"})
		return
	}

	existing, _ := userRepo.GetByUsername(req.Username)
	if existing != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
		return
	}

	user, err := userRepo.Create(req.Username, req.Password, req.Name, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, dtos.ToUserResponse(user))
}

func GetProfile(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	user, err := userRepo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, dtos.ToUserResponse(user))
}

func UpdateProfile(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req dtos.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := userRepo.UpdateProfile(uint(id), req.Name, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, dtos.ToUserResponse(user))
}
