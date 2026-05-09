package handlers

import (
	"net/http"
	"strconv"

	"GoFlowWeb/internal/dtos"
	"GoFlowWeb/internal/entities"
	"GoFlowWeb/internal/repositories"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var workflowRepo *repositories.WorkflowRepository

func InitSavedWorkflowHandlers(db *gorm.DB) {
	workflowRepo = repositories.NewWorkflowRepository(db)
}

func SaveWorkflow(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req dtos.SaveWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name, nodes, and edges are required"})
		return
	}

	workflow := entities.Workflow{
		UserID: userID,
		Name:   req.Name,
		Nodes:  string(req.Nodes),
		Edges:  string(req.Edges),
	}

	if err := workflowRepo.Create(&workflow); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save workflow"})
		return
	}

	c.JSON(http.StatusCreated, dtos.ToWorkflowResponse(&workflow))
}

func GetSavedWorkflows(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	workflows, err := workflowRepo.GetByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve workflows"})
		return
	}
	c.JSON(http.StatusOK, dtos.ToWorkflowListResponse(workflows))
}

func GetSavedWorkflow(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	workflow, err := workflowRepo.GetByID(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}
	c.JSON(http.StatusOK, dtos.ToWorkflowResponse(workflow))
}

func UpdateSavedWorkflow(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	workflow, err := workflowRepo.GetByID(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}

	var req dtos.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		workflow.Name = req.Name
	}
	if req.Nodes != nil {
		workflow.Nodes = string(req.Nodes)
	}
	if req.Edges != nil {
		workflow.Edges = string(req.Edges)
	}

	if err := workflowRepo.Update(workflow); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update workflow"})
		return
	}

	c.JSON(http.StatusOK, dtos.ToWorkflowResponse(workflow))
}

func DeleteSavedWorkflow(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow id"})
		return
	}

	if err := workflowRepo.Delete(uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete workflow"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}