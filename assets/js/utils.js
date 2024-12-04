let parser;

async function initAdjacencyMatrix() {
    parser = new Parser();
    await parser.init();
    
    // Initialiser la matrice d'adjacence avec des zéros
    const matrix = Array.from({ length: parser.vertexCount }, () => Array(parser.vertexCount).fill(0));

    // Remplir la matrice d'adjacence avec les données des arêtes
    parser.edges.forEach(edge => {
        const vertex1 = parseInt(edge.vertex1_id);
        const vertex2 = parseInt(edge.vertex2_id);
        const travelTime = edge.travel_time;
        
        // Remplir les deux positions dans la matrice 
        matrix[vertex1][vertex2] = travelTime;
        matrix[vertex2][vertex1] = travelTime;
    });

    return matrix;
}
