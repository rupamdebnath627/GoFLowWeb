package utils

import "GoFlowWeb/internal/dtos"

const (
	white = 0
	gray  = 1
	black = 2
)

func FindCycle(nodes []dtos.Node, edges []dtos.Edge) []string {
	adj := make(map[string][]string)
	labels := make(map[string]string)

	for _, node := range nodes {
		adj[node.ID] = nil
		labels[node.ID] = node.Data.Label
	}
	for _, edge := range edges {
		adj[edge.Source] = append(adj[edge.Source], edge.Target)
	}

	color := make(map[string]int)
	for _, node := range nodes {
		color[node.ID] = white
	}

	for _, node := range nodes {
		if color[node.ID] != white {
			continue
		}
		if cycle := dfs(node.ID, adj, color, labels); cycle != nil {
			return cycle
		}
	}
	return nil
}

func dfs(nodeID string, adj map[string][]string, color map[string]int, labels map[string]string) []string {
	type frame struct {
		id  string
		idx int
	}

	stack := []frame{{id: nodeID, idx: 0}}
	color[nodeID] = gray

	for len(stack) > 0 {
		top := &stack[len(stack)-1]
		children := adj[top.id]

		if top.idx < len(children) {
			childID := children[top.idx]
			top.idx++

			if color[childID] == gray {
				cycle := []string{labels[childID]}
				for i := len(stack) - 1; i >= 0; i-- {
					cycle = append(cycle, labels[stack[i].id])
					if stack[i].id == childID {
						break
					}
				}
				for i, j := 0, len(cycle)-1; i < j; i, j = i+1, j-1 {
					cycle[i], cycle[j] = cycle[j], cycle[i]
				}
				return cycle
			}
			if color[childID] == white {
				color[childID] = gray
				stack = append(stack, frame{id: childID, idx: 0})
			}
		} else {
			color[top.id] = black
			stack = stack[:len(stack)-1]
		}
	}
	return nil
}
