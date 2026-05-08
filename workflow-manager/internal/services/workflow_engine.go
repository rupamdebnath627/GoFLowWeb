package services

import (
	"fmt"
	"os/exec"

	"GoFlowWeb/internal/models"
)

type taskResult struct {
	nodeID string
	output string
	err    error
}

type WorkflowEngine struct {
	labels   map[string]string
	commands map[string]string
	optional map[string]bool
	children map[string][]string
	parents  map[string][]string
	indegree map[string]int
	failed   map[string]bool
}

func NewWorkflowEngine() *WorkflowEngine {
	return &WorkflowEngine{
		labels:   make(map[string]string),
		commands: make(map[string]string),
		optional: make(map[string]bool),
		children: make(map[string][]string),
		parents:  make(map[string][]string),
		indegree: make(map[string]int),
		failed:   make(map[string]bool),
	}
}

func (we *WorkflowEngine) AddTask(id, label, command string, optional bool) {
	we.labels[id] = label
	we.commands[id] = command
	we.optional[id] = optional
	if _, exists := we.indegree[id]; !exists {
		we.indegree[id] = 0
	}
}

func (we *WorkflowEngine) AddDependency(from, to string) {
	we.children[from] = append(we.children[from], to)
	we.parents[to] = append(we.parents[to], from)
	we.indegree[to]++
}

func (we *WorkflowEngine) shouldSkip(nodeID string) bool {
	for _, parentID := range we.parents[nodeID] {
		if we.failed[parentID] && !we.optional[parentID] {
			return true
		}
	}
	return false
}

// Execute runs the workflow and sends each task log to eventCh as it completes.
// It closes eventCh when done.
func (we *WorkflowEngine) Execute(eventCh chan<- models.TaskLog) {
	defer close(eventCh)

	totalTasks := len(we.labels)
	completedTasks := 0
	doneCh := make(chan taskResult, totalTasks)

	fmt.Println("--- Starting Workflow Engine ---")

	for nodeID, count := range we.indegree {
		if count == 0 {
			go we.runTask(nodeID, doneCh)
		}
	}

	for completedTasks < totalTasks {
		result := <-doneCh
		completedTasks++

		status := "completed"
		if result.err != nil {
			if we.optional[result.nodeID] {
				status = "failed (optional)"
			} else {
				status = "failed"
				we.failed[result.nodeID] = true
			}
		}

		log := models.TaskLog{
			NodeID: result.nodeID,
			Label:  we.labels[result.nodeID],
			Status: status,
			Output: result.output,
		}
		fmt.Printf("[%s] %s (%d/%d)\n", result.nodeID, status, completedTasks, totalTasks)
		eventCh <- log

		for _, childID := range we.children[result.nodeID] {
			we.indegree[childID]--
			if we.indegree[childID] == 0 {
				if we.shouldSkip(childID) {
					we.failed[childID] = true
					doneCh <- taskResult{
						nodeID: childID,
						output: "skipped: a required parent task failed",
						err:    fmt.Errorf("skipped"),
					}
				} else {
					go we.runTask(childID, doneCh)
				}
			}
		}
	}

	fmt.Println("--- Workflow Complete ---")
}

func (we *WorkflowEngine) runTask(nodeID string, doneCh chan<- taskResult) {
	label := we.labels[nodeID]
	command := we.commands[nodeID]

	fmt.Printf("[%s] Executing: %s\n", nodeID, label)

	if command == "" {
		doneCh <- taskResult{nodeID: nodeID, output: "(no command)"}
		return
	}

	cmd := exec.Command("bash", "-c", command)
	out, err := cmd.CombinedOutput()
	output := string(out)

	if err != nil {
		doneCh <- taskResult{nodeID: nodeID, output: output, err: fmt.Errorf("%s: %w", output, err)}
		return
	}

	doneCh <- taskResult{nodeID: nodeID, output: output}
}

// StartWorkflow builds the engine and runs it in a goroutine, returning the event channel.
func StartWorkflow(nodes []models.Node, edges []models.Edge) <-chan models.TaskLog {
	engine := NewWorkflowEngine()

	for _, node := range nodes {
		engine.AddTask(node.ID, node.Data.Label, node.Data.Command, node.Data.Optional)
	}

	for _, edge := range edges {
		engine.AddDependency(edge.Source, edge.Target)
	}

	eventCh := make(chan models.TaskLog, len(nodes))
	go engine.Execute(eventCh)
	return eventCh
}