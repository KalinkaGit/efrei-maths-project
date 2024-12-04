class Graph {
    /**
     * Crée une instance de Graph.
     * @param {number} vertexCount - Nombre de sommets dans le graphe.
     */
    constructor(vertexCount = 0) {
        this.nodes = [];  // Stockage des nœuds
        this.edges = new Map();  // Stockage des arêtes sous forme de Map
        this.vertexCount = vertexCount;  // Nombre de sommets
        this.AdjacencyList = new Map();  // Liste d'adjacence pour le graphe
        this.isInitialized = false;  // Flag pour vérifier l'initialisation du graphe
    }

    /**
     * Initialise le graphe en chargeant les données depuis le cache ou via un parser.
     * Si le graphe est déjà initialisé, cette méthode ne fait rien.
     */
    async init() {
        if (this.isInitialized) {
            console.log('Le graphe est déjà initialisé.');
            return;
        }

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

        const parser = new Parser();
        await parser.init();

        this.setNodes(parser.vertices);
        this.setEdges(parser.edges);
        this.setVertexCount(parser.vertexCount);
        this.initAdjacencyList();

        localStorage.setItem('graph', JSON.stringify({
            nodes: this.nodes,
            edges: this.edges,
            vertexCount: this.vertexCount
        }));

        this.isInitialized = true;
    }

    /**
     * Définit les nœuds du graphe.
     * @param {Array} nodes - Tableau des nœuds.
     */
    setNodes(nodes) {
        this.nodes = nodes;
    }

    /**
     * Définit les arêtes du graphe.
     * @param {Map} edges - Map des arêtes.
     */
    setEdges(edges) {
        this.edges = edges;
    }

    /**
     * Définit le nombre de sommets dans le graphe.
     * @param {number} vertexCount - Nombre de sommets.
     */
    setVertexCount(vertexCount) {
        this.vertexCount = vertexCount;
    }

    /**
     * Initialise la liste d'adjacence du graphe à partir des arêtes.
     */
    initAdjacencyList() {
        this.AdjacencyList.clear();
        this.edges.forEach(edge => {
            const vertex1 = +edge.vertex1_id;
            const vertex2 = +edge.vertex2_id;
            const travelTime = edge.travel_time;

            if (!this.AdjacencyList.has(vertex1)) this.AdjacencyList.set(vertex1, []);
            if (!this.AdjacencyList.has(vertex2)) this.AdjacencyList.set(vertex2, []);
            
            this.AdjacencyList.get(vertex1).push({ node: vertex2, weight: travelTime });
            this.AdjacencyList.get(vertex2).push({ node: vertex1, weight: travelTime });
        });
    }

    /**
     * Vérifie si le graphe est connexe.
     * @returns {boolean} - Retourne `true` si le graphe est connexe, `false` sinon.
     */
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

    /**
     * Calcule les plus courts chemins depuis un nœud de départ en utilisant l'algorithme de Dijkstra.
     * @param {number} startNode - Nœud de départ.
     * @returns {Object} - Contient les distances et les nœuds précédents.
     */
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

    /**
     * Récupère le chemin le plus court entre deux nœuds.
     * @param {number} startNode - Nœud de départ.
     * @param {number} endNode - Nœud de destination.
     * @returns {Array} - Tableau représentant le chemin le plus court.
     */
    getShortestPath(startNode, endNode) {
        const { previousNodes } = this.dijkstra(startNode);
        const path = [];
        for (let at = endNode; at !== null; at = previousNodes[at]) {
            path.push(at);
        }
        return path.reverse();
    }

    /**
     * Applique l'algorithme de Kruskal pour calculer l'arbre couvrant de poids minimum (ACPM).
     * @returns {Object} - Contient l'ACPM et son poids total.
     */
    kruskal() {
        const edgesSorted = [...this.edges].sort((a, b) => a.travel_time - b.travel_time);

        const unionFind = new UnionFind(this.vertexCount);
        const mst = [];
        let totalWeight = 0;

        for (const edge of edgesSorted) {
            const { vertex1_id, vertex2_id, travel_time } = edge;
            const root1 = unionFind.find(vertex1_id);
            const root2 = unionFind.find(vertex2_id);

            if (root1 !== root2) {
                unionFind.union(root1, root2);
                mst.push(edge);
                totalWeight += travel_time;
            }
        }

        return { mst, totalWeight };
    }
}

// Exemple d'utilisation du Graph avec Kruskal
(async () => {
    const graph = new Graph();
    await graph.init();  // Initialiser le graphe
    console.log(graph.AdjacencyList)
    console.log(graph.edges)
    console.log(graph.nodes)

    const startNode = 66; // Le nœud de départ
    const endNode = 319;   // Le nœud de destination

    const { distances, previousNodes } = graph.dijkstra(startNode);
    console.log('Distances depuis le nœud', startNode, ':', distances);
    console.log('Chemin le plus court du nœud', startNode, 'au nœud', endNode, ':', graph.getShortestPath(startNode, endNode));

    // Calcul de l'arbre couvrant de poids minimum (ACPM)
    const { mst, totalWeight } = graph.kruskal();

    // Afficher l'ACPM et son poids total
    console.log('ACPM:', mst);
    console.log('Poids total de l\'ACPM:', totalWeight);
})();

