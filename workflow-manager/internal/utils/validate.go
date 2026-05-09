package utils

import (
	"fmt"
	"strings"

	"GoFlowWeb/internal/dtos"
)

func bfs(startID string, adj map[string][]string) map[string]bool {
	visited := map[string]bool{startID: true}
	queue := []string{startID}
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		for _, neighbor := range adj[current] {
			if !visited[neighbor] {
				visited[neighbor] = true
				queue = append(queue, neighbor)
			}
		}
	}
	return visited
}

// ValidateWorkflow checks the graph for cycles, unreachable nodes, and nodes that can't reach End.
// Returns a list of error strings, or nil if valid.
func ValidateWorkflow(nodes []dtos.Node, edges []dtos.Edge) []string {
	var errors []string

	labels := make(map[string]string)
	fwd := make(map[string][]string)
	rev := make(map[string][]string)

	for _, node := range nodes {
		labels[node.ID] = node.Data.Label
		fwd[node.ID] = nil
		rev[node.ID] = nil
	}
	for _, edge := range edges {
		fwd[edge.Source] = append(fwd[edge.Source], edge.Target)
		rev[edge.Target] = append(rev[edge.Target], edge.Source)
	}

	// All nodes reachable from start
	fromStart := bfs("start", fwd)
	var unreachable []string
	for _, node := range nodes {
		if !fromStart[node.ID] {
			unreachable = append(unreachable, labels[node.ID])
		}
	}
	if len(unreachable) > 0 {
		errors = append(errors, fmt.Sprintf("Unreachable from Start: %s", strings.Join(unreachable, ", ")))
	}

	// End reachable from all nodes (BFS backwards from end)
	toEnd := bfs("end", rev)
	var cantReachEnd []string
	for _, node := range nodes {
		if !toEnd[node.ID] {
			cantReachEnd = append(cantReachEnd, labels[node.ID])
		}
	}
	if len(cantReachEnd) > 0 {
		errors = append(errors, fmt.Sprintf("Cannot reach End: %s", strings.Join(cantReachEnd, ", ")))
	}

	// Cycle check
	if cycle := FindCycle(nodes, edges); cycle != nil {
		errors = append(errors, fmt.Sprintf("Circular dependency: %s", strings.Join(cycle, " → ")))
	}

	return errors
}
