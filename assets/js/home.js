let GRAPH_LOADED = new Graph();

(async () => {
    await GRAPH_LOADED.init();

    const startNode = 66;
    const endNode = 319;

    // Exécuter Dijkstra pour trouver le chemin le plus court
    const { distances, previousNodes } = GRAPH_LOADED.dijkstra(startNode);
    console.log(`Distances depuis le nœud ${startNode} :`, distances);
    console.log(
        `Chemin le plus court du nœud ${startNode} au nœud ${endNode} :`,
        GRAPH_LOADED.getShortestPath(startNode, endNode)
    );

    // Calculer l'arbre couvrant de poids minimum (ACPM)
    const { mst, totalWeight } = GRAPH_LOADED.kruskal();
    console.log('ACPM:', mst);
    console.log('Poids total de l\'ACPM:', totalWeight);

    // Initialisation et dessin du graphe
    await init();
    setupSearch();
})();

function secondesToTime(secondes) {
    let hours = Math.floor(secondes / 3600);
    let minutes = Math.floor((secondes % 3600) / 60);
    let seconds = secondes % 60;

    let time = '';
    if (hours > 0) {
        time += `${hours}h `;
    }
    if (minutes > 0) {
        time += `${minutes}min `;
    }
    time += `${seconds}s`;

    return time;
}

/**
 * Initialise la position des nœuds, dessine le graphe, définit le zoom
 * et met en place l’autocomplétion.
 */
async function init() {
    const graphNodes = GRAPH_LOADED.nodes;
    const posPoints = GRAPH_LOADED.posPoint;

    // Associer les coordonnées (x,y) aux nœuds
    Object.values(posPoints).forEach(posPoint => {
        Object.values(graphNodes).forEach(node => {
            if (node.station_name === posPoint.name) {
                node.x = posPoint.x * 2.5;
                node.y = posPoint.y * 2.5;
            }
        });
    });

    console.log("Nœuds :", graphNodes);
    console.log("Arêtes :", GRAPH_LOADED.edges);

    // Créer la liste des liens pour D3
    const links = GRAPH_LOADED.edges.map(edge => ({
        source: graphNodes[edge.vertex1_id],
        target: graphNodes[edge.vertex2_id],
        travel_time: edge.travel_time
    }));

    // Générer un dictionnaire de couleurs par ligne
    const colors = generateLineColors(graphNodes);

    // Créer et mettre en place le SVG + zoom
    const { svg, g } = createSVGAndGroup();
    applyZoom(svg, g);

    // Dessin des éléments du graphe
    drawLinks(g, links, colors);
    drawNodes(g, graphNodes, colors);
    drawLabels(g, graphNodes);

    // Ajustement de la vue initiale
    fitGraphToView(svg, g);

    // Mettre en place l'autocomplétion pour les champs de recherche
    setupAutocomplete('start-search', 'start-suggestions');
    setupAutocomplete('end-search', 'end-suggestions');

    // Gestion de la redimension de la fenêtre
    window.addEventListener('resize', () => updateSVGSize(svg));
}

/**
 * Génère des couleurs distinctes pour chaque ligne de métro/tram.
 */
function generateLineColors(graphNodes) {
    const colors = {};
    for (const node of Object.values(graphNodes)) {
        if (colors[node.line_number] === undefined) {
            colors[node.line_number] = d3.interpolateRainbow(Math.random());
        }
    }
    return colors;
}

/**
 * Crée l'élément SVG, son groupe principal, et gère les dimensions.
 */
function createSVGAndGroup() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g");

    return { svg, g };
}

/**
 * Met en place le zoom sur le SVG.
 */
function applyZoom(svg, g) {
    svg.call(
        d3.zoom()
            .scaleExtent([0.5, 5])
            .on("zoom", event => g.attr("transform", event.transform))
    );
}

/**
 * Dessine les liens (arêtes) du graphe.
 */
function drawLinks(g, links, colors) {
    g.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("source", d => d.source.vertex_id)
        .attr("target", d => d.target.vertex_id)
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .style("stroke", d => colors[d.source.line_number])
        .style("stroke-width", 1);
}

/**
 * Dessine les nœuds (stations) du graphe.
 */
function drawNodes(g, graphNodes, colors) {
    g.selectAll(".node")
        .data(Object.values(graphNodes))
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .style("fill", d => colors[d.line_number]);
}

/**
 * Dessine les étiquettes (labels) des nœuds.
 */
function drawLabels(g, graphNodes) {
    g.selectAll(".label")
        .data(Object.values(graphNodes))
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => d.x + 5)
        .attr("y", d => d.y - 5)
        .text(d => d.station_name)
        .style("fill", "black");
}

/**
 * Ajuste la vue initiale du graphe pour qu'il s'adapte à la fenêtre.
 */
function fitGraphToView(svg, g) {
    const svgWidth = svg.attr('width');
    const svgHeight = svg.attr('height');
    const graphBBox = g.node().getBBox();

    const scale = Math.min(svgWidth / graphBBox.width, svgHeight / graphBBox.height);
    const translateX = (svgWidth - graphBBox.width * scale) / 2 - graphBBox.x * scale;
    const translateY = (svgHeight - graphBBox.height * scale) / 2 - graphBBox.y * scale;
    g.attr('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
}

/**
 * Met à jour la taille du SVG lors du redimensionnement de la fenêtre.
 */
function updateSVGSize(svg) {
    svg.attr('width', window.innerWidth)
       .attr('height', window.innerHeight);
}

/**
 * Met en place l'autocomplétion sur un champ de saisie donné.
 */
function setupAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        suggestions.innerHTML = '';

        if (query.length > 1) {
            const matchedNodes = Object.values(GRAPH_LOADED.nodes)
                .filter(node => node.station_name.toLowerCase().includes(query));

            matchedNodes.forEach(node => {
                const li = document.createElement('li');
                li.textContent = node.station_name;
                li.dataset.id = node.vertex_id;
                suggestions.appendChild(li);
            });

            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    });

    suggestions.addEventListener('click', event => {
        if (event.target.tagName === 'LI') {
            input.value = event.target.textContent;
            input.dataset.id = event.target.dataset.id;
            suggestions.style.display = 'none';
        }
    });

    document.addEventListener('click', event => {
        if (!input.contains(event.target) && !suggestions.contains(event.target)) {
            suggestions.style.display = 'none';
        }
    });
}

/**
 * Met en place le comportement de recherche du chemin.
 */
function setupSearch() {
    const searchButton = document.getElementById('search');

    searchButton.addEventListener('click', () => {
        const startId = parseInt(document.getElementById('start-search').dataset.id);
        const endId = parseInt(document.getElementById('end-search').dataset.id);

        if (startId && endId) {
            const path = GRAPH_LOADED.getShortestPath(startId, endId);
            console.log("Chemin trouvé :", path);

            displayPathResults(path);
            zoomToPath(path);
            highlightPath(path);
        } else {
            alert('Veuillez sélectionner des arrêts valides.');
        }
    });
}

/**
 * Affiche les résultats du chemin dans la liste prévue à cet effet.
 */
function displayPathResults(path) {
    const resultsContainer = document.querySelector('.results-container');
    const resultsList = document.getElementById('results');
    resultsList.innerHTML = '';

    let totalTime = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];

        const edge = GRAPH_LOADED.edges.find(e =>
            (e.vertex1_id == current && e.vertex2_id == next) ||
            (e.vertex2_id == current && e.vertex1_id == next)
        );

        totalTime += edge.travel_time;

        const li = document.createElement('li');
        li.textContent = `${GRAPH_LOADED.nodes[current].station_name} (${GRAPH_LOADED.nodes[current].line_number}) -> ${GRAPH_LOADED.nodes[next].station_name} (${GRAPH_LOADED.nodes[next].line_number}) : ${secondesToTime(edge.travel_time)}`;
        resultsList.appendChild(li);
    }

    resultsContainer.style.display = 'block';
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
 * Met en évidence le chemin dans le graphe (arêtes plus épaisses sur le chemin).
 */
function highlightPath(path) {
    const links = document.querySelectorAll('.link');
    links.forEach(link => {
        const sourceId = parseInt(link.getAttribute('source'));
        const targetId = parseInt(link.getAttribute('target'));

        if (path.includes(sourceId) && path.includes(targetId)) {
            link.style.strokeWidth = 3;
        } else {
            link.style.strokeWidth = 1;
        }
    });
}
