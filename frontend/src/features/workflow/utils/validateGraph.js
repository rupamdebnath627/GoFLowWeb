const WHITE = 0, GRAY = 1, BLACK = 2;

export function findCycle(nodes, edges) {
  const adj = {};
  const labels = {};
  for (const node of nodes) {
    adj[node.id] = [];
    labels[node.id] = node.data.label;
  }
  for (const edge of edges) {
    if (adj[edge.source]) adj[edge.source].push(edge.target);
  }

  const color = {};
  for (const node of nodes) {
    color[node.id] = WHITE;
  }

  for (const node of nodes) {
    if (color[node.id] === WHITE) {
      const stack = [{ id: node.id, idx: 0 }];
      color[node.id] = GRAY;

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        const children = adj[top.id] || [];

        if (top.idx < children.length) {
          const childId = children[top.idx];
          top.idx++;

          if (color[childId] === GRAY) {
            const cycle = [labels[childId]];
            for (let i = stack.length - 1; i >= 0; i--) {
              cycle.push(labels[stack[i].id]);
              if (stack[i].id === childId) break;
            }
            cycle.reverse();
            return cycle;
          }
          if (color[childId] === WHITE) {
            color[childId] = GRAY;
            stack.push({ id: childId, idx: 0 });
          }
        } else {
          color[top.id] = BLACK;
          stack.pop();
        }
      }
    }
  }
  return null;
}

function bfs(startId, adj) {
  const visited = new Set();
  const queue = [startId];
  visited.add(startId);
  while (queue.length > 0) {
    const current = queue.shift();
    for (const neighbor of (adj[current] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited;
}

export function validateWorkflow(nodes, edges) {
  const errors = [];
  if (nodes.length < 2) return errors;

  const labels = {};
  for (const node of nodes) {
    labels[node.id] = node.data.label;
  }

  const fwd = {};
  const rev = {};
  for (const node of nodes) {
    fwd[node.id] = [];
    rev[node.id] = [];
  }
  for (const edge of edges) {
    if (fwd[edge.source]) fwd[edge.source].push(edge.target);
    if (rev[edge.target]) rev[edge.target].push(edge.source);
  }

  const fromStart = bfs('start', fwd);
  const unreachable = nodes.filter((n) => !fromStart.has(n.id));
  if (unreachable.length > 0) {
    const names = unreachable.map((n) => n.data.label).join(', ');
    errors.push(`Unreachable from Start: ${names}`);
  }

  const toEnd = bfs('end', rev);
  const cantReachEnd = nodes.filter((n) => !toEnd.has(n.id));
  if (cantReachEnd.length > 0) {
    const names = cantReachEnd.map((n) => n.data.label).join(', ');
    errors.push(`Cannot reach End: ${names}`);
  }

  const cycle = findCycle(nodes, edges);
  if (cycle) {
    errors.push(`Circular dependency: ${cycle.join(' \u2192 ')}`);
  }

  return errors;
}