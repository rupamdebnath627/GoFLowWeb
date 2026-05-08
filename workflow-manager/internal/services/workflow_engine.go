package services

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"sync/atomic"
	"syscall"

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

	paused        atomic.Bool
	pauseCh       chan struct{} // closed when resumed, recreated on pause
	pauseNotifyCh chan struct{} // signals Execute loop that pause was requested
}

func NewWorkflowEngine() *WorkflowEngine {
	return &WorkflowEngine{
		labels:        make(map[string]string),
		commands:      make(map[string]string),
		optional:      make(map[string]bool),
		children:      make(map[string][]string),
		parents:       make(map[string][]string),
		indegree:      make(map[string]int),
		failed:        make(map[string]bool),
		pauseCh:       make(chan struct{}),
		pauseNotifyCh: make(chan struct{}, 1),
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

func (we *WorkflowEngine) Pause() {
	if we.paused.CompareAndSwap(false, true) {
		we.pauseCh = make(chan struct{})
		// Notify the Execute loop
		select {
		case we.pauseNotifyCh <- struct{}{}:
		default:
		}
	}
}

func (we *WorkflowEngine) Resume() {
	if we.paused.CompareAndSwap(true, false) {
		close(we.pauseCh)
	}
}

func (we *WorkflowEngine) waitIfPaused(ctx context.Context) bool {
	if !we.paused.Load() {
		return false
	}
	select {
	case <-we.pauseCh:
		return false
	case <-ctx.Done():
		return true
	}
}

func (we *WorkflowEngine) dispatchChild(ctx context.Context, childID string, eventCh chan<- models.TaskLog, doneCh chan taskResult) bool {
	if we.paused.Load() && childID != "start" && childID != "end" {
		eventCh <- models.TaskLog{
			NodeID: childID,
			Label:  we.labels[childID],
			Status: "paused",
		}
		if we.waitIfPaused(ctx) {
			return true
		}
	}
	eventCh <- models.TaskLog{
		NodeID: childID,
		Label:  we.labels[childID],
		Status: "running",
	}
	go we.runTask(ctx, childID, doneCh)
	return false
}

func (we *WorkflowEngine) Execute(ctx context.Context, eventCh chan<- models.TaskLog) {
	defer close(eventCh)

	totalTasks := len(we.labels)
	completedTasks := 0
	doneCh := make(chan taskResult, totalTasks)
	runningCount := 0

	fmt.Println("--- Starting Workflow Engine ---")

	for nodeID, count := range we.indegree {
		if count == 0 {
			eventCh <- models.TaskLog{
				NodeID: nodeID,
				Label:  we.labels[nodeID],
				Status: "running",
			}
			runningCount++
			go we.runTask(ctx, nodeID, doneCh)
		}
	}

	completed := make(map[string]bool)

	for completedTasks < totalTasks {
		select {
		case <-ctx.Done():
			fmt.Println("--- Workflow Cancelled ---")
			for runningCount > 0 {
				result := <-doneCh
				runningCount--
				completedTasks++
				completed[result.nodeID] = true
				eventCh <- models.TaskLog{
					NodeID: result.nodeID,
					Label:  we.labels[result.nodeID],
					Status: "cancelled",
					Output: "cancelled by user",
				}
			}
			for nodeID := range we.labels {
				if !completed[nodeID] {
					completedTasks++
					eventCh <- models.TaskLog{
						NodeID: nodeID,
						Label:  we.labels[nodeID],
						Status: "cancelled",
						Output: "cancelled before execution",
					}
				}
			}
			return

		case <-we.pauseNotifyCh:
			// Pause was requested — send a workflow-level pause event
			eventCh <- models.TaskLog{
				NodeID: "engine",
				Label:  "Workflow paused",
				Status: "paused",
			}

		case result := <-doneCh:
			runningCount--
			completedTasks++
			completed[result.nodeID] = true

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
						runningCount++
					} else {
						cancelled := we.dispatchChild(ctx, childID, eventCh, doneCh)
						if cancelled {
							for nodeID := range we.labels {
								if !completed[nodeID] {
									completedTasks++
									eventCh <- models.TaskLog{
										NodeID: nodeID,
										Label:  we.labels[nodeID],
										Status: "cancelled",
										Output: "cancelled before execution",
									}
									completed[nodeID] = true
								}
							}
							return
						}
						runningCount++
					}
				}
			}
		}
	}

	fmt.Println("--- Workflow Complete ---")
}

func (we *WorkflowEngine) runTask(ctx context.Context, nodeID string, doneCh chan<- taskResult) {
	label := we.labels[nodeID]
	command := we.commands[nodeID]

	fmt.Printf("[%s] Executing: %s\n", nodeID, label)

	if command == "" {
		doneCh <- taskResult{nodeID: nodeID, output: "(no command)"}
		return
	}

	cmd := exec.Command("bash", "-c", command)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	var buf bytes.Buffer
	cmd.Stdout = &buf
	cmd.Stderr = &buf

	if err := cmd.Start(); err != nil {
		doneCh <- taskResult{nodeID: nodeID, output: err.Error(), err: err}
		return
	}

	waitDone := make(chan error, 1)
	go func() {
		waitDone <- cmd.Wait()
	}()

	select {
	case <-ctx.Done():
		if cmd.Process != nil {
			_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
		}
		<-waitDone
		doneCh <- taskResult{nodeID: nodeID, output: buf.String(), err: ctx.Err()}
	case err := <-waitDone:
		output := buf.String()
		if err != nil {
			doneCh <- taskResult{nodeID: nodeID, output: output, err: fmt.Errorf("%s: %w", output, err)}
		} else {
			doneCh <- taskResult{nodeID: nodeID, output: output}
		}
	}
}

func StartWorkflow(nodes []models.Node, edges []models.Edge) (<-chan models.TaskLog, context.CancelFunc, *WorkflowEngine) {
	engine := NewWorkflowEngine()

	for _, node := range nodes {
		engine.AddTask(node.ID, node.Data.Label, node.Data.Command, node.Data.Optional)
	}

	for _, edge := range edges {
		engine.AddDependency(edge.Source, edge.Target)
	}

	ctx, cancel := context.WithCancel(context.Background())
	eventCh := make(chan models.TaskLog, len(nodes)*2)
	go engine.Execute(ctx, eventCh)
	return eventCh, cancel, engine
}
