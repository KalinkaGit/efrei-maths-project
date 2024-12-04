let GRAPH_LOADED = new Graph();

// Exemple d'utilisation du Graph avec Kruskal
(async () => {
    await GRAPH_LOADED.init();  // Initialiser le graphe

    const startNode = 66; // Le nœud de départ
    const endNode = 319;   // Le nœud de destination

    const { distances, previousNodes } = GRAPH_LOADED.dijkstra(startNode);
    console.log('Distances depuis le nœud', startNode, ':', distances);
    console.log('Chemin le plus court du nœud', startNode, 'au nœud', endNode, ':', GRAPH_LOADED.getShortestPath(startNode, endNode));

    // Calcul de l'arbre couvrant de poids minimum (ACPM)
    const { mst, totalWeight } = GRAPH_LOADED.kruskal();

    // Afficher l'ACPM et son poids total
    console.log('ACPM:', mst);
    console.log('Poids total de l\'ACPM:', totalWeight);    
    
    await init();

    window.addEventListener('resize', () => {
        svg.attr('width', window.innerWidth)
           .attr('height', window.innerHeight);
    });    
})();

async function init() {
    let graph_nodes = GRAPH_LOADED.nodes;
    const pos_points = GRAPH_LOADED.posPoint;

    // Associer les positions aux nœuds
    for (const pos_point of Object.values(pos_points)) {
        for (let node of Object.values(graph_nodes)) {
            if (node.station_name === pos_point.name) {
                node.x = pos_point.x;
                node.y = pos_point.y;
            }
        }
    }

    console.log("new", graph_nodes);
    console.log("edges", GRAPH_LOADED.edges);

    // Préparer les liens
    const links = GRAPH_LOADED.edges.map(edge => {
        return {
            source: graph_nodes[edge.vertex1_id],
            target: graph_nodes[edge.vertex2_id],
            travel_time: edge.travel_time
        };
    });

    // Générer des couleurs pour chaque ligne
    let colors = {};
    for (let [k, v] of Object.entries(graph_nodes)) {
        if (colors[v.line_number] === undefined) {
            colors[v.line_number] = d3.interpolateRainbow(Math.random());
        }
    }

    // Définir les dimensions du SVG pour qu'il prenne toute la fenêtre
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Créer l'élément SVG et un groupe 'g' pour le zoom
    const svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom()
            .scaleExtent([0.5, 5]) // Limites du zoom
            .on("zoom", function(event) {
                g.attr("transform", event.transform);
            })
        );

    // Créer un groupe 'g' pour contenir les éléments du graphe
    const g = svg.append("g");

    // Dessiner les arêtes
    const link = g.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .style("stroke", d => colors[d.source.line_number])
        .style("stroke-width", 1);

    // Dessiner les nœuds
    const node = g.selectAll(".node")
        .data(Object.values(graph_nodes))
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .style("fill", d => colors[d.line_number]);

    // Ajouter les labels
    const labels = g.selectAll(".label")
        .data(Object.values(graph_nodes))
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => d.x + 5)
        .attr("y", d => d.y - 5)
        .text(d => d.station_name)
        .style("fill", "black");
}
