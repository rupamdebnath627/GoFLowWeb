package services

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"sync"
	"syscall"

	"GoFlowWeb/internal/dtos"
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

	pauseMu       sync.Mutex
	paused        bool
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
	we.pauseMu.Lock()
	defer we.pauseMu.Unlock()
	if we.paused {
		return
	}
	we.paused = true
	we.pauseCh = make(chan struct{})
	select {
	case we.pauseNotifyCh <- struct{}{}:
	default:
	}
}

func (we *WorkflowEngine) Resume() {
	we.pauseMu.Lock()
	defer we.pauseMu.Unlock()
	if !we.paused {
		return
	}
	we.paused = false
	close(we.pauseCh)
}

// getPauseState returns the current pause flag and the channel to wait on.
// Must be used together to avoid reading a stale channel.
func (we *WorkflowEngine) getPauseState() (bool, chan struct{}) {
	we.pauseMu.Lock()
	defer we.pauseMu.Unlock()
	return we.paused, we.pauseCh
}

func (we *WorkflowEngine) waitIfPaused(ctx context.Context) bool {
	paused, ch := we.getPauseState()
	if !paused {
		return false
	}
	select {
	case <-ch:
		return false
	case <-ctx.Done():
		return true
	}
}

// dispatchReady sends "paused" events for all pausable nodes, waits for resume,
// then launches all of them. Returns true if cancelled while waiting.
func (we *WorkflowEngine) dispatchReady(ctx context.Context, readyIDs []string, eventCh chan<- dtos.TaskLog, doneCh chan taskResult) bool {
	paused, _ := we.getPauseState()

	// Separate pausable vs non-pausable (start/end always run immediately)
	var pausable, immediate []string
	for _, id := range readyIDs {
		if paused && id != "start" && id != "end" {
			pausable = append(pausable, id)
		} else {
			immediate = append(immediate, id)
		}
	}

	// Launch non-pausable nodes right away
	for _, id := range immediate {
		eventCh <- dtos.TaskLog{
			NodeID: id,
			Label:  we.labels[id],
			Status: "running",
		}
		go we.runTask(ctx, id, doneCh)
	}

	// If there are pausable nodes, mark them all as paused, wait once, then launch all
	if len(pausable) > 0 {
		for _, id := range pausable {
			eventCh <- dtos.TaskLog{
				NodeID: id,
				Label:  we.labels[id],
				Status: "paused",
			}
		}
		if we.waitIfPaused(ctx) {
			return true
		}
		for _, id := range pausable {
			eventCh <- dtos.TaskLog{
				NodeID: id,
				Label:  we.labels[id],
				Status: "running",
			}
			go we.runTask(ctx, id, doneCh)
		}
	}

	return false
}

func (we *WorkflowEngine) Execute(ctx context.Context, eventCh chan<- dtos.TaskLog) {
	defer close(eventCh)

	totalTasks := len(we.labels)
	completedTasks := 0
	doneCh := make(chan taskResult, totalTasks)
	runningCount := 0

	fmt.Println("--- Starting Workflow Engine ---")

	for nodeID, count := range we.indegree {
		if count == 0 {
			eventCh <- dtos.TaskLog{
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
				eventCh <- dtos.TaskLog{
					NodeID: result.nodeID,
					Label:  we.labels[result.nodeID],
					Status: "cancelled",
					Output: "cancelled by user",
				}
			}
			for nodeID := range we.labels {
				if !completed[nodeID] {
					completedTasks++
					eventCh <- dtos.TaskLog{
						NodeID: nodeID,
						Label:  we.labels[nodeID],
						Status: "cancelled",
						Output: "cancelled before execution",
					}
				}
			}
			return

		case <-we.pauseNotifyCh:
			eventCh <- dtos.TaskLog{
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

			log := dtos.TaskLog{
				NodeID: result.nodeID,
				Label:  we.labels[result.nodeID],
				Status: status,
				Output: result.output,
			}
			fmt.Printf("[%s] %s (%d/%d)\n", result.nodeID, status, completedTasks, totalTasks)
			eventCh <- log

			var readyToDispatch []string
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
						readyToDispatch = append(readyToDispatch, childID)
					}
				}
			}
			if len(readyToDispatch) > 0 {
				if we.dispatchReady(ctx, readyToDispatch, eventCh, doneCh) {
					for nodeID := range we.labels {
						if !completed[nodeID] {
							completedTasks++
							eventCh <- dtos.TaskLog{
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
				runningCount += len(readyToDispatch)
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

func StartWorkflow(nodes []dtos.Node, edges []dtos.Edge) (<-chan dtos.TaskLog, context.CancelFunc, *WorkflowEngine) {
	engine := NewWorkflowEngine()

	for _, node := range nodes {
		engine.AddTask(node.ID, node.Data.Label, node.Data.Command, node.Data.Optional)
	}

	for _, edge := range edges {
		engine.AddDependency(edge.Source, edge.Target)
	}

	ctx, cancel := context.WithCancel(context.Background())
	eventCh := make(chan dtos.TaskLog, len(nodes)*2)
	go engine.Execute(ctx, eventCh)
	return eventCh, cancel, engine
}
