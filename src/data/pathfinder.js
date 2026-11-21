import { ALL_NODES, ALL_EDGES, STAIRS, FLOORS } from './buildingData.js';

// Build adjacency map from all nodes + edges + stair connections
const buildGraph = () => {
  const graph = {};
  ALL_NODES.forEach(n => { graph[n.id] = { node: n, neighbors: [] }; });

  // Add stair transition nodes (virtual nodes at stair positions on each floor)
  STAIRS.forEach(s => {
    const id = `stair_${s.fromFloor}_${s.toFloor}_${s.x}`;
    if (!graph[s.nodeFrom]) return;
    if (!graph[s.nodeTo]) return;
  });

  // Wire up edges (bidirectional)
  ALL_EDGES.forEach(([a, b]) => {
    if (!graph[a] || !graph[b]) return;
    const na = graph[a].node;
    const nb = graph[b].node;
    const dist = Math.hypot(nb.x - na.x, (nb.floor - na.floor) * 8, nb.z - na.z);
    graph[a].neighbors.push({ id: b, cost: dist });
    graph[b].neighbors.push({ id: a, cost: dist });
  });

  return graph;
};

const GRAPH = buildGraph();

// Heuristic: 3D euclidean distance
const heuristic = (a, b) => {
  const na = GRAPH[a]?.node;
  const nb = GRAPH[b]?.node;
  if (!na || !nb) return Infinity;
  const floorDiff = Math.abs(na.floor - nb.floor) * 8; // penalise floor changes
  return Math.hypot(nb.x - na.x, floorDiff, nb.z - na.z);
};

// A* pathfinding — returns array of node IDs
export const findPath = (startNodeId, endNodeId) => {
  if (startNodeId === endNodeId) return [startNodeId];
  if (!GRAPH[startNodeId] || !GRAPH[endNodeId]) return [];

  const openSet = new Set([startNodeId]);
  const cameFrom = {};
  const gScore = { [startNodeId]: 0 };
  const fScore = { [startNodeId]: heuristic(startNodeId, endNodeId) };

  let iterations = 0;
  while (openSet.size > 0 && iterations < 5000) {
    iterations++;
    // Get node with lowest fScore
    let current = null;
    let lowestF = Infinity;
    openSet.forEach(id => {
      const f = fScore[id] ?? Infinity;
      if (f < lowestF) { lowestF = f; current = id; }
    });

    if (current === endNodeId) return reconstructPath(cameFrom, current);

    openSet.delete(current);
    const neighbors = GRAPH[current]?.neighbors ?? [];

    for (const { id: neighbor, cost } of neighbors) {
      const tentativeG = (gScore[current] ?? Infinity) + cost;
      if (tentativeG < (gScore[neighbor] ?? Infinity)) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + heuristic(neighbor, endNodeId);
        openSet.add(neighbor);
      }
    }
  }
  return []; // no path found
};

const reconstructPath = (cameFrom, current) => {
  const path = [current];
  while (cameFrom[current]) {
    current = cameFrom[current];
    path.unshift(current);
  }
  return path;
};

// Find nearest corridor node to a room
export const getNearestNodeForRoom = (roomId) => {
  // Check if any node has this roomId directly
  for (const floor of FLOORS) {
    const doorNode = floor.nodes.find(n => n.roomId === roomId);
    if (doorNode) return doorNode.id;
  }
  // Fallback: find closest spine node on the same floor
  const allRooms = FLOORS.flatMap(f => f.rooms);
  const room = allRooms.find(r => r.id === roomId);
  if (!room) return null;
  const floorNodes = FLOORS.find(f => f.id === room.floor)?.nodes ?? [];
  const spineNodes = floorNodes.filter(n => !n.roomId);
  const roomCenterX = room.x + room.w / 2;
  let closest = null, closestDist = Infinity;
  spineNodes.forEach(n => {
    const d = Math.abs(n.x - roomCenterX);
    if (d < closestDist) { closestDist = d; closest = n.id; }
  });
  return closest;
};

// Get node object by id
export const getNode = (id) => GRAPH[id]?.node ?? null;

// Get full path with 3D world coordinates
export const getPathPoints = (pathNodeIds) => {
  return pathNodeIds
    .map(id => getNode(id))
    .filter(Boolean)
    .map(n => ({ x: n.x, y: (n.floor - 1) * 5, z: n.z, floor: n.floor }));
};

// Describe floor changes in a path (for step counter)
export const getPathInstructions = (pathNodeIds) => {
  const instructions = [];
  let prevFloor = null;
  pathNodeIds.forEach(id => {
    const n = getNode(id);
    if (!n) return;
    if (prevFloor !== null && n.floor !== prevFloor) {
      const dir = n.floor > prevFloor ? 'up' : 'down';
      instructions.push({
        type: 'floor_change',
        from: prevFloor,
        to: n.floor,
        direction: dir,
        label: `Take stairs ${dir} to Floor ${n.floor}`,
      });
    }
    prevFloor = n.floor;
  });
  return instructions;
};