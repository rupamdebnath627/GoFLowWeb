import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 172;
const NODE_HEIGHT = 40;

function getLayoutedElements(nodes, edges, direction = 'TB') {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 80 });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const nodePositions = {};
  const layoutedNodes = nodes.map((node) => {
    const { x, y } = graph.node(node.id);
    nodePositions[node.id] = { x, y };
    return {
      ...node,
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      },
    };
  });

  // Assign source/target handles based on relative positions of connected nodes
  const layoutedEdges = edges.map((edge) => {
    const sourcePos = nodePositions[edge.source];
    const targetPos = nodePositions[edge.target];

    let sourceHandle = 'bottom';
    let targetHandle = 'top';

    if (direction === 'TB' && sourcePos && targetPos) {
      // If the target is far to the right/left, use side handles to reduce crossings
      const dx = targetPos.x - sourcePos.x;
      if (Math.abs(dx) > NODE_WIDTH) {
        sourceHandle = dx > 0 ? 'right' : 'left';
        targetHandle = dx > 0 ? 'left' : 'right';
      }
    }

    return {
      ...edge,
      type: 'smoothstep',
      sourceHandle,
      targetHandle,
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

export default getLayoutedElements;