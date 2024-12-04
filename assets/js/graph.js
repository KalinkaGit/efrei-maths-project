class Graph {
    constructor(vertexCount = 0) {
        this.nodes = [];  // Stockage des nœuds
        this.edges = new Map();  // Stockage des arêtes sous forme de Map
        this.vertexCount = vertexCount;  // Nombre de sommets
        this.AdjacencyList = new Map();  // Liste d'adjacence pour le graphe
        this.isInitialized = false;  // Flag pour vérifier l'initialisation du graphe
    }

    // Méthode d'initialisation du graphe
    async init() {

        // Vérifier si le graphe est déjà initialisé
        if (this.isInitialized) {
            console.log('Le graphe est déjà initialisé.');
            return;  // Ne rien faire si déjà initialisé
        }

        // Vérifier si les données du graphe sont présentes dans le cache
        const cachedGraph = localStorage.getItem('graph');
        if (cachedGraph) {
            const parsedGraph = JSON.parse(cachedGraph);
            this.setNodes(parsedGraph.nodes);
            this.setEdges(parsedGraph.edges);
            this.setVertexCount(parsedGraph.vertexCount);
            this.initAdjacencyList();
            this.isInitialized = true;
            console.log('Graph chargé depuis le cache.');
            return;
        }

        // Si les données ne sont pas dans le cache, les charger normalement
        const parser = new Parser();
        await parser.init();  // Simulation de l'initialisation des données

        this.setNodes(parser.vertices);
        this.setEdges(parser.edges);
        this.setVertexCount(parser.vertexCount);
        this.initAdjacencyList();

        // Mettre le graphe en cache pour les futurs accès
        localStorage.setItem('graph', JSON.stringify({
            nodes: this.nodes,
            edges: this.edges,
            vertexCount: this.vertexCount
        }));

        this.isInitialized = true;
    }

    // Méthode pour définir les nœuds
    setNodes(nodes) {
        this.nodes = nodes;
    }

    // Méthode pour définir les arêtes
    setEdges(edges) {
        this.edges = edges;
    }

    // Méthode pour définir le nombre de sommets
    setVertexCount(vertexCount) {
        this.vertexCount = vertexCount;
    }

    // Initialiser la liste d'adjacence
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

    // Vérifier si le graphe est connexe
    isConnexe() {
        const visited = new Array(this.vertexCount).fill(false);
        const dfs = (node) => {
            visited[node] = true;
            (this.AdjacencyList.get(node) || []).forEach(({ node: neighbor }) => {
                if (!visited[neighbor]) dfs(neighbor);
            });
        };

        dfs(0);  // Commencer le DFS depuis le nœud 0
        return visited.every(v => v);  // Vérifier si tous les nœuds ont été visités
    }

    // Algorithme de Dijkstra pour calculer les plus courts chemins
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

    // Récupérer le chemin le plus court entre deux nœuds
    getShortestPath(startNode, endNode) {
        const { previousNodes } = this.dijkstra(startNode);
        const path = [];
        for (let at = endNode; at !== null; at = previousNodes[at]) {
            path.push(at);
        }
        return path.reverse();  // Inverser le chemin pour obtenir l'ordre correct
    }
}

// Exemple d'utilisation du Graph
(async () => {
    const graph = new Graph();
    await graph.init();  // Initialiser le graphe

    const startNode = 66; // Le nœud de départ
    const endNode = 319;   // Le nœud de destination

    const { distances, previousNodes } = graph.dijkstra(startNode);
    console.log('Distances depuis le nœud', startNode, ':', distances);
    console.log('Chemin le plus court du nœud', startNode, 'au nœud', endNode, ':', graph.getShortestPath(startNode, endNode));
})();
