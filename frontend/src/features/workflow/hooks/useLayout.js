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

  const layoutedEdges = edges.map((edge) => {
    const sourcePos = nodePositions[edge.source];
    const targetPos = nodePositions[edge.target];

    let sourceHandle = 'source-bottom';
    let targetHandle = 'target-top';

    if (sourcePos && targetPos) {
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        sourceHandle = dx > 0 ? 'source-right' : 'source-left';
        targetHandle = dx > 0 ? 'target-left' : 'target-right';
      } else if (dy > 0) {
        sourceHandle = 'source-bottom';
        targetHandle = 'target-top';
      } else {
        sourceHandle = 'source-top';
        targetHandle = 'target-bottom';
      }
    }

    return {
      ...edge,
      type: 'smoothstep',
      sourceHandle,
      targetHandle,
      markerEnd: { type: 'arrowclosed', width: 15, height: 15 },
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

export default getLayoutedElements;