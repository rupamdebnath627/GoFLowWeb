package services

import (
	"fmt"
	"time"

	"GoFlowWeb/internal/models"
)

type WorkflowEngine struct {
	labels   map[string]string   // NodeID -> label
	children map[string][]string // adjacency list
	indegree map[string]int      // dependency counter
	logs     []models.TaskLog    // execution logs
}

func NewWorkflowEngine() *WorkflowEngine {
	return &WorkflowEngine{
		labels:   make(map[string]string),
		children: make(map[string][]string),
		indegree: make(map[string]int),
	}
}

func (we *WorkflowEngine) AddTask(id string, label string) {
	we.labels[id] = label
	if _, exists := we.indegree[id]; !exists {
		we.indegree[id] = 0
	}
}

func (we *WorkflowEngine) AddDependency(from string, to string) {
	we.children[from] = append(we.children[from], to)
	we.indegree[to]++
}

func (we *WorkflowEngine) Execute() []models.TaskLog {
	totalTasks := len(we.labels)
	completedTasks := 0
	doneCh := make(chan string, totalTasks)

	fmt.Println("--- Starting Workflow Engine ---")

	for nodeID, count := range we.indegree {
		if count == 0 {
			go we.runTask(nodeID, doneCh)
		}
	}

	for completedTasks < totalTasks {
		completedNodeID := <-doneCh
		completedTasks++

		we.logs = append(we.logs, models.TaskLog{
			NodeID: completedNodeID,
			Label:  we.labels[completedNodeID],
			Status: "completed",
		})

		for _, childID := range we.children[completedNodeID] {
			we.indegree[childID]--
			if we.indegree[childID] == 0 {
				go we.runTask(childID, doneCh)
			}
		}
	}

	fmt.Println("--- Workflow Complete ---")
	return we.logs
}

func (we *WorkflowEngine) runTask(nodeID string, doneCh chan<- string) {
	label := we.labels[nodeID]
	fmt.Printf("[%s] Executing: %s\n", nodeID, label)
	time.Sleep(1 * time.Second)
	doneCh <- nodeID
}

func ExecuteWorkflow(nodes []models.Node, edges []models.Edge) []models.TaskLog {
	engine := NewWorkflowEngine()

	for _, node := range nodes {
		engine.AddTask(node.ID, node.Data.Label)
	}

	for _, edge := range edges {
		engine.AddDependency(edge.Source, edge.Target)
	}

	return engine.Execute()
}
