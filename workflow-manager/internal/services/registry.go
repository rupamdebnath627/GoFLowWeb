package services

import (
	"context"
	"fmt"
	"sync"

	"GoFlowWeb/internal/dtos"
)

type WorkflowEntry struct {
	EventCh <-chan dtos.TaskLog
	Cancel  context.CancelFunc
	Engine  *WorkflowEngine
	UserID  uint
	claimed bool
}

type WorkflowRegistry struct {
	mu  sync.Mutex
	seq int
	m   map[string]*WorkflowEntry
}

func NewRegistry() *WorkflowRegistry {
	return &WorkflowRegistry{m: make(map[string]*WorkflowEntry)}
}

// Register stores a new workflow and returns its ID.
func (r *WorkflowRegistry) Register(eventCh <-chan dtos.TaskLog, cancel context.CancelFunc, engine *WorkflowEngine, userID uint) string {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.seq++
	id := fmt.Sprintf("wf-%d", r.seq)
	r.m[id] = &WorkflowEntry{EventCh: eventCh, Cancel: cancel, Engine: engine, UserID: userID}
	return id
}

// Get returns the entry if it exists.
func (r *WorkflowRegistry) Get(id string) (*WorkflowEntry, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	entry, ok := r.m[id]
	return entry, ok
}

// Claim atomically marks an entry as claimed for WebSocket consumption.
// Returns the entry and true if successful, nil and false if not found or already claimed.
func (r *WorkflowRegistry) Claim(id string) (*WorkflowEntry, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	entry, ok := r.m[id]
	if !ok || entry.claimed {
		return nil, false
	}
	entry.claimed = true
	return entry, true
}

// Remove deletes a workflow entry.
func (r *WorkflowRegistry) Remove(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.m, id)
}
