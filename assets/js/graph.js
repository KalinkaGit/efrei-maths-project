class Graph {
    /**
     * Crée une instance de Graph.
     * @param {number} vertexCount - Nombre de sommets dans le graphe.
     */
    constructor(vertexCount = 0) {
        this.nodes = [];  // Stockage des nœuds
        this.edges = new Map();  // Stockage des arêtes sous forme de Map
        this.vertexCount = vertexCount;  // Nombre de sommets
        this.posPoint = []
        this.dicoAdjency = new Map();  // Liste d'adjacence pour le graphe
        this.isInitialized = false;  // Flag pour vérifier l'initialisation du graphe
    }

    /**
     * Initialise le graphe en chargeant les données depuis le parser.
     * Si le graphe est déjà initialisé, cette méthode ne fait rien.
     */
    async init() {
        const parser = new Parser();
        await parser.init();

        this.setNodes(parser.nodes);
        this.setEdges(parser.edges);
        this.setVertexCount(parser.vertexCount);
        this.setPosPoint(parser.posPoints);
        this.initdicoAdjency();
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
     * Définit les positions du points du graphe
     * @param {Array} listPosPoint - Liste des position des point .
     */
        setPosPoint(listPosPoint) {
            this.posPoint = listPosPoint;
        }

    /**
     * Initialise la liste d'adjacence du graphe à partir des arêtes.
     */
    initdicoAdjency() {
        this.dicoAdjency.clear();
        this.edges.forEach(edge => {
            const vertex1 = +edge.vertex1_id;
            const vertex2 = +edge.vertex2_id;
            const travelTime = edge.travel_time;

            if (!this.dicoAdjency.has(vertex1)) this.dicoAdjency.set(vertex1, []);
            if (!this.dicoAdjency.has(vertex2)) this.dicoAdjency.set(vertex2, []);
            
            this.dicoAdjency.get(vertex1).push({ node: vertex2, weight: travelTime });
            this.dicoAdjency.get(vertex2).push({ node: vertex1, weight: travelTime });
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
            (this.dicoAdjency.get(node) || []).forEach(({ node: neighbor }) => {
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

            for (let { node: neighbor, weight } of (this.dicoAdjency.get(closestNode) || [])) {
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
        if (typeof startNode === 'string')
            startNode = +startNode;

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
