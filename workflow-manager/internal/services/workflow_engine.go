package services

import (
	"fmt"
	"os/exec"
	"sync"
	"time"

	"GoFlowWeb/internal/models"
)

type taskResult struct {
	nodeID string
	output string
	err    error
}

type WorkflowEngine struct {
	labels   map[string]string   // NodeID -> label
	commands map[string]string   // NodeID -> command
	optional map[string]bool     // NodeID -> is optional
	children map[string][]string // adjacency list
	parents  map[string][]string // reverse adjacency
	indegree map[string]int      // dependency counter
	failed   map[string]bool     // NodeID -> has failed (non-optional)
	mu       sync.Mutex
	logs     []models.TaskLog
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

// shouldSkip checks if a node has any non-optional parent that failed.
func (we *WorkflowEngine) shouldSkip(nodeID string) bool {
	for _, parentID := range we.parents[nodeID] {
		if we.failed[parentID] && !we.optional[parentID] {
			return true
		}
	}
	return false
}

func (we *WorkflowEngine) Execute() []models.TaskLog {
	totalTasks := len(we.labels)
	completedTasks := 0
	doneCh := make(chan taskResult, totalTasks)

	fmt.Println("--- Starting Workflow Engine ---")
	fmt.Println("Nodes:")
	for id, label := range we.labels {
		cmd := we.commands[id]
		if cmd == "" {
			cmd = "(no command)"
		}
		opt := ""
		if we.optional[id] {
			opt = " [optional]"
		}
		fmt.Printf("  %s: %s (indegree=%d)%s cmd=%q\n", id, label, we.indegree[id], opt, cmd)
	}
	fmt.Println("Edges:")
	for parent, kids := range we.children {
		for _, kid := range kids {
			fmt.Printf("  %s -> %s\n", parent, kid)
		}
	}

	for nodeID, count := range we.indegree {
		if count == 0 {
			go we.runTask(nodeID, doneCh)
		}
	}

	timeout := time.After(time.Duration(totalTasks*30+30) * time.Second)
	for completedTasks < totalTasks {
		select {
		case result := <-doneCh:
			completedTasks++

			status := "completed"
			if result.err != nil {
				if we.optional[result.nodeID] {
					status = "failed (optional)"
					fmt.Printf("[%s] Failed (optional) (%d/%d): %v\n", result.nodeID, completedTasks, totalTasks, result.err)
				} else {
					status = "failed"
					we.failed[result.nodeID] = true
					fmt.Printf("[%s] Failed (%d/%d): %v\n", result.nodeID, completedTasks, totalTasks, result.err)
				}
			} else {
				fmt.Printf("[%s] Completed (%d/%d)\n", result.nodeID, completedTasks, totalTasks)
			}

			we.mu.Lock()
			we.logs = append(we.logs, models.TaskLog{
				NodeID: result.nodeID,
				Label:  we.labels[result.nodeID],
				Status: status,
				Output: result.output,
			})
			we.mu.Unlock()

			for _, childID := range we.children[result.nodeID] {
				we.indegree[childID]--
				if we.indegree[childID] == 0 {
					if we.shouldSkip(childID) {
						// A required parent failed — skip this node and propagate
						we.failed[childID] = true
						fmt.Printf("[%s] Skipped (parent failed)\n", childID)
						doneCh <- taskResult{
							nodeID: childID,
							output: "skipped: a required parent task failed",
							err:    fmt.Errorf("skipped: a required parent task failed"),
						}
					} else {
						go we.runTask(childID, doneCh)
					}
				}
			}
		case <-timeout:
			fmt.Printf("--- Workflow TIMEOUT: completed %d/%d tasks ---\n", completedTasks, totalTasks)
			fmt.Println("Stuck nodes (indegree > 0):")
			for id, deg := range we.indegree {
				if deg > 0 {
					fmt.Printf("  %s: %s (indegree=%d)\n", id, we.labels[id], deg)
				}
			}
			we.mu.Lock()
			we.logs = append(we.logs, models.TaskLog{
				NodeID: "engine",
				Label:  "Workflow timed out - possible cycle or missing edges",
				Status: "error",
			})
			we.mu.Unlock()
			return we.logs
		}
	}

	fmt.Println("--- Workflow Complete ---")
	return we.logs
}

func (we *WorkflowEngine) runTask(nodeID string, doneCh chan<- taskResult) {
	label := we.labels[nodeID]
	command := we.commands[nodeID]

	fmt.Printf("[%s] Executing: %s\n", nodeID, label)

	if command == "" {
		fmt.Printf("[%s] No command, skipping\n", nodeID)
		doneCh <- taskResult{nodeID: nodeID, output: "(no command)"}
		return
	}

	fmt.Printf("[%s] Running: %s\n", nodeID, command)
	cmd := exec.Command("bash", "-c", command)
	out, err := cmd.CombinedOutput()
	output := string(out)

	if err != nil {
		doneCh <- taskResult{nodeID: nodeID, output: output, err: fmt.Errorf("%s: %w", output, err)}
		return
	}

	fmt.Printf("[%s] Output: %s\n", nodeID, output)
	doneCh <- taskResult{nodeID: nodeID, output: output}
}

func ExecuteWorkflow(nodes []models.Node, edges []models.Edge) []models.TaskLog {
	engine := NewWorkflowEngine()

	for _, node := range nodes {
		engine.AddTask(node.ID, node.Data.Label, node.Data.Command, node.Data.Optional)
	}

	for _, edge := range edges {
		engine.AddDependency(edge.Source, edge.Target)
	}

	return engine.Execute()
}