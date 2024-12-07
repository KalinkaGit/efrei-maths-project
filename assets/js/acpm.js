let GRAPH_LOADED = new Graph();

// Dictionnaire de couleurs pour chaque numéro de ligne
const lineColors = {
    "1": "#FFBE00", // Jaune
    "2": "#0055C8", // Bleu
    "3": "#6E6E00", // Marron
    "3bis": "#82c8e6", // Bleu clair
    "4": "#A0006E", // Violet
    "5": "#FF5A00", // Orange
    "6": "#82DC73", // Vert
    "7": "#FF82B4", // Rose
    "7bis": "#82DC73", // Vert clair
    "8": "#D282BE", // Violet foncé
    "9": "#D2D200", // Jaune clair
    "10": "#DC9600", // Brun
    "11": "#6E491E", // Vert foncé
    "12": "#00643C", // Vert
    "13": "#82C8E6", // Bleu foncé
    "14": "#640082" // Violet profond
};

(async () => {
    await GRAPH_LOADED.init();

    const startNode = 66;
    const endNode = 319;

    // Exécuter Dijkstra pour trouver le chemin le plus court
    const { distances, previousNodes } = GRAPH_LOADED.dijkstra(startNode);

    // Calculer l'arbre couvrant de poids minimum (ACPM)
    const { mst, totalWeight } = GRAPH_LOADED.kruskal();

    // Initialisation et dessin du graphe
    await init();
})();

function secondesToTime(secondes) {
    let hours = Math.floor(secondes / 3600);
    let minutes = Math.floor((secondes % 3600) / 60);
    let seconds = secondes % 60;

    let time = "";
    if (hours > 0) {
        time += `${hours}h `;
    }
    if (minutes > 0) {
        time += `${minutes}min `;
    }
    time += `${seconds}s`;

    return time;
}

async function init() {
    const graphNodes = GRAPH_LOADED.nodes;
    const posPoints = GRAPH_LOADED.posPoint;

    // Associer les coordonnées (x,y) aux nœuds
    Object.values(posPoints).forEach((posPoint) => {
        Object.values(graphNodes).forEach((node) => {
            if (node.station_name === posPoint.name) {
                node.x = posPoint.x * 2.5;
                node.y = posPoint.y * 2.5;
            }
        });
    });

    // Créer la liste des liens pour D3
    const links = GRAPH_LOADED.edges.map((edge) => ({
        source: graphNodes[edge.vertex1_id],
        target: graphNodes[edge.vertex2_id],
        travel_time: edge.travel_time,
    }));

    // Générer un dictionnaire de couleurs par ligne
    const colors = lineColors;

    // Créer et mettre en place le SVG + zoom
    const { svg, g } = createSVGAndGroup();
    let zoom = applyZoom(svg, g);

    // Dessin des éléments du graphe
    drawLinks(g, links, colors);
    drawNodes(g, graphNodes, colors);
    drawLabels(g, graphNodes);

    enableSelection(svg, g);

    // Gestion de la redimension de la fenêtre
    window.addEventListener("resize", () => updateSVGSize(svg));
}

function createSVGAndGroup() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

    const g = svg.append("g");

    return { svg, g };
}

function applyZoom(svg, g) {
    const zoom = d3.zoom()
        .filter((event) => !event.shiftKey) // Désactiver le zoom si Shift est enfoncé
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    return zoom;
}


function drawLinks(g, links, colors) {
    g.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("source", (d) => d.source.vertex_id)
        .attr("target", (d) => d.target.vertex_id)
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)
        .style("stroke", (d) => colors[d.source.line_number] || "#000000")
        .style("stroke-width", 1);
}

function drawNodes(g, graphNodes, colors) {
    g.selectAll(".node")
        .data(Object.values(graphNodes))
        .enter()
        .append("circle")
        .attr("data-id", (d) => d.vertex_id)
        .attr("class", "node")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 4)
        .style("fill", (d) => colors[d.line_number] || "#000000");
}

function drawLabels(g, graphNodes) {
    g.selectAll(".label")
        .data(Object.values(graphNodes))
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => d.x + 5)
        .attr("y", (d) => d.y - 5)
        .text((d) => d.station_name)
        .style("fill", "black");
}

function fitGraphToView(svg, g, zoom) {
    const svgWidth = +svg.attr("width");
    const svgHeight = +svg.attr("height");
    const graphBBox = g.node().getBBox();

    const scale = Math.min(svgWidth / graphBBox.width, svgHeight / graphBBox.height);
    const translateX = (svgWidth - graphBBox.width * scale) / 2 - graphBBox.x * scale;
    const translateY = (svgHeight - graphBBox.height * scale) / 2 - graphBBox.y * scale;

    svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
}

function updateSVGSize(svg) {
    svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
}

/**
 * Fait un zoom sur le chemin trouvé afin de centrer la vue sur ce dernier.
 */
function zoomToPath(path) {
    const pathNodes = path.map(nodeId => GRAPH_LOADED.nodes[nodeId]);
    const xValues = pathNodes.map(node => node.x);
    const yValues = pathNodes.map(node => node.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const svg = d3.select('svg');
    const svgWidth = parseInt(svg.attr('width'));
    const svgHeight = parseInt(svg.attr('height'));

    const scale = Math.min(svgWidth / xRange, svgHeight / yRange);
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;

    const translateX = (svgWidth - xRange * scale) / 2 - xCenter * scale;
    const translateY = (svgHeight - yRange * scale) / 2 - yCenter * scale;

    svg.transition()
       .duration(750)
       .call(d3.zoom().transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
}

/**
 * Met en évidence le chemin dans le graphe (arêtes et nœuds sur le chemin gardent leurs couleurs, les autres sont gris).
 */
function highlightPath(path) {
    const links = document.querySelectorAll('.link');
    const nodes = document.querySelectorAll('.node');

    // Mettre en évidence les arêtes sur le chemin
    links.forEach(link => {
        const sourceId = parseInt(link.getAttribute('source'));
        const targetId = parseInt(link.getAttribute('target'));

        if (path.includes(sourceId) && path.includes(targetId)) {
            link.style.strokeWidth = 3; // Épaisseur des arêtes du chemin
            link.style.opacity = 1; // Chemin bien visible
        } else {
            link.style.stroke = "gray"; // Autres arêtes grisées
            link.style.strokeWidth = 1;
            link.style.opacity = 0.5; // Atténuer les arêtes non sélectionnées
        }
    });

    // Mettre en évidence les nœuds sur le chemin
    nodes.forEach(node => {
        const nodeId = parseInt(node.getAttribute('data-id'));

        if (path.includes(nodeId)) {
            node.style.opacity = 1; // Nœud bien visible
            node.style.stroke = "black"; // Contour pour mieux démarquer
            node.style.strokeWidth = 2;
        } else {
            node.style.fill = "gray"; // Autres nœuds gris
            node.style.stroke = "none"; // Pas de contour
            node.style.opacity = 0.5; // Atténuer les nœuds non sélectionnés
        }
    });
}

function enableSelection(svg, g) {
    let isDragging = false;
    let selectionRect;
    let startX, startY;

    svg.on("mousedown", (event) => {
        if (!event.shiftKey) return; // Activer uniquement si Shift est enfoncé
        event.preventDefault();

        const transform = d3.zoomTransform(g.node());
        const [x, y] = transform.invert(d3.pointer(event, svg.node())); // Convertir les coordonnées du pointeur
        startX = x;
        startY = y;

        isDragging = true;

        // Créer un rectangle pour la sélection
        selectionRect = g.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", 0)
            .attr("height", 0)
            .attr("class", "selection")
            .style("stroke", "blue")
            .style("stroke-width", 2)
            .style("fill", "rgba(135, 206, 250, 0.3)"); // Couleur semi-transparente
    });

    svg.on("mousemove", (event) => {
        if (isDragging) {
            const transform = d3.zoomTransform(g.node());
            const [x, y] = transform.invert(d3.pointer(event, svg.node())); // Convertir les coordonnées du pointeur

            const width = Math.abs(x - startX);
            const height = Math.abs(y - startY);

            // Ajuster les dimensions et position du rectangle
            selectionRect
                .attr("x", Math.min(x, startX))
                .attr("y", Math.min(y, startY))
                .attr("width", width)
                .attr("height", height);
        }
    });

    svg.on("mouseup", (event) => {
        if (isDragging) {
            isDragging = false;

            if (selectionRect) {
                const rect = selectionRect.node().getBBox();
                selectionRect.remove();

                const selectedNodes = getNodesInSelection(rect);
                const selectedEdges = getEdgesInSelection(selectedNodes);

                // Colorer les nœuds et arêtes sélectionnés
                if (selectedNodes.length > 1) {
                    highlightSelection(selectedNodes, selectedEdges);
                    const { mst, totalWeight } = calculateACPM(selectedNodes, selectedEdges);
                    document.getElementById("weight").innerHTML = `${totalWeight}`;
                }
            }
        }
    });
}

function getNodesInSelection(rect) {
    const allNodes = Object.values(GRAPH_LOADED.nodes);
    return allNodes.filter(node => {
        const { x, y } = node;
        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    });
}

function getEdgesInSelection(selectedNodes) {
    const nodeIds = selectedNodes.map(node => node.vertex_id);
    return GRAPH_LOADED.edges.filter(edge =>
        nodeIds.includes(edge.vertex1_id) && nodeIds.includes(edge.vertex2_id)
    );
}

function highlightSelection(selectedNodes, selectedEdges) {
    // Colorer les nœuds sélectionnés
    d3.selectAll(".node")
        .style("fill", "gray") // Réinitialiser tous les nœuds
        .filter(node => selectedNodes.some(selected => selected.vertex_id === node.vertex_id))
        .style("fill", "red"); // Mettre en évidence les nœuds sélectionnés

    const links = document.querySelectorAll('.link');

    links.forEach(link => {
        const sourceId = parseInt(link.getAttribute('source'));
        const targetId = parseInt(link.getAttribute('target'));

        const isLinkSelected = selectedEdges.some(edge =>
            (edge.vertex1_id == sourceId && edge.vertex2_id == targetId) ||
            (edge.vertex1_id == targetId && edge.vertex2_id == sourceId)
        );

        if (isLinkSelected) {
            link.style.stroke = "red"; // Mettre en évidence les arêtes sélectionnées
            link.style.strokeWidth = 3;
        } else {
            link.style.stroke = "gray"; // Griser les autres arêtes
            link.style.strokeWidth = 1;
        }
    });
}

function calculateACPM(nodes, edges) {
    const graphNodes = {};
    const graphEdges = [];
    nodes.forEach(node => {
        graphNodes[node.vertex_id] = node;
    });

    edges.forEach(edge => {
        graphEdges.push(edge);
    });

    const graph = new Graph(); // Assurez-vous d'avoir une méthode pour recréer un graphe
    graph.setNodes(graphNodes);
    graph.setEdges(graphEdges);
    graph.initdicoAdjency();
    graph.vertexCount = nodes.length;

    return graph.kruskal(); // Calculer l'ACPM
}
