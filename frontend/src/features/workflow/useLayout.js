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
    return {
      ...edge,
      type: 'smoothstep',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      markerEnd: { type: 'arrowclosed', width: 15, height: 15 },
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

export default getLayoutedElements;