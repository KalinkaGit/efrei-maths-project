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
    setupSearch();
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

    // Ajustement de la vue initiale
    fitGraphToView(svg, g, zoom);

    // Mettre en place l'autocomplétion pour les champs de recherche
    setupAutocomplete("start-search", "start-suggestions");
    setupAutocomplete("end-search", "end-suggestions");

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
    // Créer et stocker le zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    return zoom; // Retourner l'instance du zoom pour usage ultérieur
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

function createSuggestionElement(node) {
    const li = document.createElement('li');
    li.dataset.id = node.vertex_id;

    // Élément pour le nom de la station
    const stationNameSpan = document.createElement('span');
    stationNameSpan.textContent = node.station_name;
    stationNameSpan.style.marginRight = '10px';

    // Élément pour le rond avec le numéro de ligne
    const lineCircle = document.createElement('span');
    lineCircle.textContent = node.line_number;
    if (node.line_number.includes('bis')) {
        lineCircle.textContent = node.line_number.replace('bis', 'b');
    }
    lineCircle.style.display = 'inline-block';
    lineCircle.style.width = '20px';
    lineCircle.style.height = '20px';
    lineCircle.style.borderRadius = '50%';
    lineCircle.style.backgroundColor = lineColors[node.line_number] || '#000';
    lineCircle.style.color = '#fff';
    lineCircle.style.textAlign = 'center';
    lineCircle.style.lineHeight = '20px';
    lineCircle.style.float = 'right';

    // Insérer les éléments dans le li
    li.appendChild(stationNameSpan);
    li.appendChild(lineCircle);

    return li;
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
                const li = createSuggestionElement(node);
                suggestions.appendChild(li);
            });

            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    });

    suggestions.addEventListener('click', event => {
        if (event.target.tagName === 'LI') {
            input.value = GRAPH_LOADED.nodes[event.target.dataset.id].station_name;
            input.dataset.id = event.target.dataset.id;
            suggestions.style.display = 'none';
        }

        if (event.target.tagName === 'SPAN' && event.target.parentElement.tagName === 'LI') {
            input.value = GRAPH_LOADED.nodes[event.target.parentElement.dataset.id].station_name;
            input.dataset.id = event.target.parentElement.dataset.id;
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
        let startId = parseInt(document.getElementById('start-search').dataset.id);
        let endId = parseInt(document.getElementById('end-search').dataset.id);

        const startInput = document.getElementById('start-search');
        const endInput = document.getElementById('end-search');

        // Si aucune suggestion n'a été cliquée, essayer de retrouver le noeud par le nom
        if (!startId || isNaN(startId)) {
            const startNode = Object.values(GRAPH_LOADED.nodes).find(
                node => node.station_name.toLowerCase() === startInput.value.toLowerCase()
            );
            if (startNode) {
                startId = startNode.vertex_id;
            }
        }

        if (!endId || isNaN(endId)) {
            const endNode = Object.values(GRAPH_LOADED.nodes).find(
                node => node.station_name.toLowerCase() === endInput.value.toLowerCase()
            );
            if (endNode) {
                endId = endNode.vertex_id;
            }
        }

        if ((startId && endId) && (startId !== endId)) {
            const path = GRAPH_LOADED.getShortestPath(startId, endId);
            displayPathResults(path);
            zoomToPath(path);
            highlightPath(path);
        } else {
            alert('Veuillez sélectionner ou saisir des arrêts valides.');
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

    let finalTime = 0;
    let totalTime = 0;
    let currentLine = GRAPH_LOADED.nodes[path[0]].line_number;
    let startPoint = path[0];

    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];

        const edge = GRAPH_LOADED.edges.find(e =>
            (e.vertex1_id == current && e.vertex2_id == next) ||
            (e.vertex2_id == current && e.vertex1_id == next)
        );

        finalTime += edge.travel_time;
        totalTime += edge.travel_time;

        const nextLine = GRAPH_LOADED.nodes[next].line_number;

        // Détecter un changement de ligne ou si c'est la fin du chemin
        if (nextLine !== currentLine || i === path.length - 2) {
            const li = document.createElement('li');
            const endPoint = next; // Arrêt final avant changement
            li.textContent = `${GRAPH_LOADED.nodes[startPoint].station_name} (${currentLine}) -> ${GRAPH_LOADED.nodes[endPoint].station_name} (${currentLine}) : ${secondesToTime(totalTime)}`;
            resultsList.appendChild(li);

            // Réinitialiser pour le segment suivant
            totalTime = 0;
            startPoint = endPoint;
            currentLine = nextLine;
        }
    }

    // add total time
    const li = document.createElement('li');
    li.textContent = `Temps total : ${secondesToTime(finalTime)}`;
    resultsList.appendChild(li);

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

/**
 * Réinitialise les champs de saisie lors du chargement de la page.
 */
function resetInputFields() {
    const inputFields = ['start-search', 'end-search'];
    inputFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.value = ''; // Vide la valeur du champ
            input.dataset.id = ''; // Réinitialise également l'ID associé
        }
    });
}
