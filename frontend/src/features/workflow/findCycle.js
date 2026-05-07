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