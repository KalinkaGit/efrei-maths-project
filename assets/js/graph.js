class Graph {
    constructor(vertexCount = 0) {
        this.nodes = new Set();
        this.edges = new Map();
        this.vertexCount = vertexCount;
        this.AdjacencyMatrix = null;
    }


    async init() {
        const parser = new Parser();
        await parser.init();

        this.setNodes(parser.vertices);
        this.setEdges(parser.edges);
        this.setVertexCount(parser.vertexCount);
        this.initAdjacencyMatrix();
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

    initAdjacencyMatrix() {
        // Initialiser la matrice d'adjacence avec des zéros
        this.AdjacencyMatrix = Array.from({ length: this.vertexCount }, () => Array(this.vertexCount).fill(0));
    
        // Remplir la matrice d'adjacence avec les données des arêtes
        this.edges.forEach(edge => {
            const vertex1 = parseInt(edge.vertex1_id);
            const vertex2 = parseInt(edge.vertex2_id);
            const travelTime = edge.travel_time;
            
            // Remplir les deux positions dans la matrice 
            this.AdjacencyMatrix[vertex1][vertex2] = travelTime;
            this.AdjacencyMatrix[vertex2][vertex1] = travelTime;
        });
    
        return this.AdjacencyMatrix;
    }
    
    isConnexe() {
        const visited = new Array(this.AdjacencyMatrix.length).fill(false);
    
        const dfs = (node) => {
            visited[node] = true;
    
            for (let i = 0; i < this.AdjacencyMatrix[node].length; i++) {
                if (this.AdjacencyMatrix[node][i] !== 0 && !visited[i]) {
                    dfs(i);
                }
            }
        };
    
        dfs(0);
    
        return visited.every(v => v);
    }
    

}

(async () => {
    const graph = new Graph();
    await graph.init()
    console.log(graph.edges);
    console.log(graph.nodes);
    console.log(graph.vertexCount);
    console.log('Le graphe est connexe :', graph.isConnexe());
})();
