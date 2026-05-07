package services

import (
	"fmt"
	"sync"
	"time"

	"GoFlowWeb/internal/models"
)

type WorkflowEngine struct {
	labels   map[string]string   // NodeID -> label
	children map[string][]string // adjacency list
	indegree map[string]int      // dependency counter
	logs     []models.TaskLog    // execution logs
	mu       sync.Mutex
	wg       sync.WaitGroup
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
	we.wg.Add(len(we.labels))

	for nodeID, count := range we.indegree {
		if count == 0 {
			go we.runTask(nodeID)
		}
	}

	we.wg.Wait()
	return we.logs
}

func (we *WorkflowEngine) runTask(nodeID string) {
	defer we.wg.Done()

	label := we.labels[nodeID]
	fmt.Printf("[%s] Executing: %s\n", nodeID, label)

	time.Sleep(1 * time.Second)

	we.mu.Lock()
	we.logs = append(we.logs, models.TaskLog{
		NodeID: nodeID,
		Label:  label,
		Status: "completed",
	})

	for _, childID := range we.children[nodeID] {
		we.indegree[childID]--
		if we.indegree[childID] == 0 {
			go we.runTask(childID)
		}
	}
	we.mu.Unlock()
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
