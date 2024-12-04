class Graph {
    constructor(vertexCount = 0) {
        this.nodes = []; // Simplifié en tableau pour un accès plus direct
        this.edges = new Map();
        this.vertexCount = vertexCount;
        this.AdjacencyList = new Map();
    }

    async init() {
        const parser = new Parser();
        await parser.init();

        this.setNodes(parser.vertices);
        this.setEdges(parser.edges);
        this.setVertexCount(parser.vertexCount);
        this.initAdjacencyList();
    }

    setNodes(nodes) {
        this.nodes = nodes;
    }

    setEdges(edges) {
        this.edges = edges;
    }

    setVertexCount(vertexCount) {
        this.vertexCount = vertexCount;
    }

    initAdjacencyList() {
        this.AdjacencyList.clear();
        this.edges.forEach(edge => {
            const vertex1 = +edge.vertex1_id;  // Optimisation avec l'opérateur unaire '+'
            const vertex2 = +edge.vertex2_id;
            const travelTime = edge.travel_time;

            if (!this.AdjacencyList.has(vertex1)) this.AdjacencyList.set(vertex1, []);
            if (!this.AdjacencyList.has(vertex2)) this.AdjacencyList.set(vertex2, []);
            
            this.AdjacencyList.get(vertex1).push({ node: vertex2, weight: travelTime });
            this.AdjacencyList.get(vertex2).push({ node: vertex1, weight: travelTime });
        });
    }

    isConnexe() {
        const visited = new Array(this.vertexCount).fill(false);
        const dfs = (node) => {
            visited[node] = true;
            (this.AdjacencyList.get(node) || []).forEach(({ node: neighbor }) => {
                if (!visited[neighbor]) dfs(neighbor);
            });
        };

        dfs(0);
        return visited.every(v => v);
    }

    dijkstra(startNode) {
        const distances = Array(this.vertexCount).fill(Infinity);
        distances[startNode] = 0;
        const previousNodes = Array(this.vertexCount).fill(null);
        const heap = new MinHeap();
        heap.push({ node: startNode, distance: 0 });

        while (heap.size() > 0) {
            const { node: closestNode, distance: currentDist } = heap.pop();
            if (currentDist > distances[closestNode]) continue;

            for (let { node: neighbor, weight } of (this.AdjacencyList.get(closestNode) || [])) {
                const newDist = currentDist + weight;
                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    previousNodes[neighbor] = closestNode;
                    heap.push({ node: neighbor, distance: newDist });
                }
            }
        }

        return { distances, previousNodes };
    }

    getShortestPath(startNode, endNode) {
        const { previousNodes } = this.dijkstra(startNode);
        const path = [];
        for (let at = endNode; at !== null; at = previousNodes[at]) {
            path.push(at);
        }
        return path.reverse();
    }
}


(async () => {
    const graph = new Graph();
    await graph.init();

    console.log(graph.edges);
    console.log(graph.nodes);
    console.log(graph.vertexCount);
    console.log('Le graphe est connexe :', graph.isConnexe());

    const startNode = 0; // Le nœud de départ
    const endNode = 3;   // Le nœud de destination

    const { distances, previousNodes } = graph.dijkstra(startNode);
    console.log('Distances depuis le nœud', startNode, ':', distances);
    console.log('Chemin le plus court du nœud', startNode, 'au nœud', endNode, ':', graph.getShortestPath(startNode, endNode));
})();
