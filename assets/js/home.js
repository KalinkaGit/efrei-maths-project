// Déclaration et initialisation du graphe
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

// Dictionnaire de noms de stations pour une recherche efficace
const stationNameToId = {};

// Initialisation asynchrone
(async () => {
    await GRAPH_LOADED.init();

    // Remplir le dictionnaire stationNameToId
    Object.values(GRAPH_LOADED.nodes).forEach(node => {
        stationNameToId[node.station_name.toLowerCase()] = node.vertex_id;
    });

    const startNode = 66;
    const endNode = 319;

    // Exécuter Dijkstra pour trouver le chemin le plus court
    const { distances, previousNodes } = GRAPH_LOADED.dijkstra(startNode);

    // Initialisation et dessin du graphe
    await init();

    // Réinitialiser les champs de saisie au chargement de la page
    resetInputFields();

    // Mettre en place les comportements de recherche
    setupSearch();

    // Mettre en place le bouton ACPM
    setupACPMButton();
})();

/**
 * Convertit les secondes en format heure, minute, seconde.
 * @param {number} secondes - Le nombre total de secondes.
 * @returns {string} - Le temps formaté.
 */
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

/**
 * Initialise le graphe et les éléments interactifs.
 */
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

/**
 * Crée le SVG et le groupe principal pour D3.
 * @returns {Object} - Contient le SVG et le groupe.
 */
function createSVGAndGroup() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Sélectionner .graph-container au lieu de body
    const svg = d3.select(".graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g");

    return { svg, g };
}

/**
 * Applique le zoom et le pan au SVG.
 * @param {Object} svg - Le SVG sélectionné par D3.
 * @param {Object} g - Le groupe principal dans le SVG.
 * @returns {Object} - L'instance de zoom.
 */
function applyZoom(svg, g) {
    // Créer et stocker le zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    return zoom; // Retourner l'instance du zoom pour usage ultérieur
}

/**
 * Dessine les liens du graphe.
 * @param {Object} g - Le groupe principal dans le SVG.
 * @param {Array} links - La liste des liens à dessiner.
 * @param {Object} colors - Le dictionnaire de couleurs par ligne.
 */
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

/**
 * Dessine les nœuds du graphe.
 * @param {Object} g - Le groupe principal dans le SVG.
 * @param {Object} graphNodes - Les nœuds du graphe.
 * @param {Object} colors - Le dictionnaire de couleurs par ligne.
 */
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

/**
 * Dessine les labels des nœuds.
 * @param {Object} g - Le groupe principal dans le SVG.
 * @param {Object} graphNodes - Les nœuds du graphe.
 */
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

/**
 * Ajuste la vue initiale du graphe pour qu'il soit centré et bien visible.
 * @param {Object} svg - Le SVG sélectionné par D3.
 * @param {Object} g - Le groupe principal dans le SVG.
 * @param {Object} zoom - L'instance de zoom.
 */
function fitGraphToView(svg, g, zoom) {
    const svgWidth = +svg.attr("width");
    const svgHeight = +svg.attr("height");
    const graphBBox = g.node().getBBox();

    const scale = Math.min(svgWidth / graphBBox.width, svgHeight / graphBBox.height);
    const translateX = (svgWidth - graphBBox.width * scale) / 2 - graphBBox.x * scale;
    const translateY = (svgHeight - graphBBox.height * scale) / 2 - graphBBox.y * scale;

    svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
}

/**
 * Met à jour la taille du SVG lors du redimensionnement de la fenêtre.
 * @param {Object} svg - Le SVG sélectionné par D3.
 */
function updateSVGSize(svg) {
    svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
}

/**
 * Crée un élément de suggestion pour l'autocomplétion.
 * @param {Object} node - Le nœud du graphe correspondant à la suggestion.
 * @returns {HTMLElement} - L'élément <li> créé.
 */
function createSuggestionElement(node) {
    const li = document.createElement('li');
    li.dataset.id = node.vertex_id;

    // Élément pour le nom de la station
    const stationNameSpan = document.createElement('span');
    stationNameSpan.textContent = node.station_name;
    stationNameSpan.style.marginRight = '10px';

    // Élément pour le rond avec le numéro de ligne
    const lineCircle = document.createElement('span');
    lineCircle.textContent = node.line_number.includes('bis') ? node.line_number.replace('bis', 'b') : node.line_number;
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
 * @param {string} inputId - L'ID de l'input.
 * @param {string} suggestionsId - L'ID de la liste de suggestions.
 */
function setupAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    let activeSuggestionIndex = -1;
    let matchedNodes = [];

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        suggestions.innerHTML = '';
        activeSuggestionIndex = -1;

        if (query.length > 1) {
            matchedNodes = Object.values(GRAPH_LOADED.nodes)
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

    input.addEventListener('keydown', (e) => {
        const items = suggestions.getElementsByTagName('li');
        if (e.key === 'ArrowDown') {
            activeSuggestionIndex++;
            if (activeSuggestionIndex >= items.length) activeSuggestionIndex = items.length - 1;
            setActiveSuggestion(items);
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            activeSuggestionIndex--;
            if (activeSuggestionIndex < 0) activeSuggestionIndex = 0;
            setActiveSuggestion(items);
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (activeSuggestionIndex > -1 && items[activeSuggestionIndex]) {
                items[activeSuggestionIndex].click();
                e.preventDefault();
            }
        }
    });

    function setActiveSuggestion(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('active');
        }
        if (activeSuggestionIndex > -1 && activeSuggestionIndex < items.length) {
            items[activeSuggestionIndex].classList.add('active');
        }
    }

    suggestions.addEventListener('click', event => {
        let targetLi = null;
        if (event.target.tagName === 'LI') {
            targetLi = event.target;
        } else if (event.target.tagName === 'SPAN' && event.target.parentElement.tagName === 'LI') {
            targetLi = event.target.parentElement;
        }

        if (targetLi) {
            const nodeId = targetLi.dataset.id;
            input.value = GRAPH_LOADED.nodes[nodeId].station_name;
            input.dataset.id = nodeId;
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
    const clearButton = document.getElementById('clear');

    searchButton.addEventListener('click', () => {
        const startInput = document.getElementById('start-search');
        const endInput = document.getElementById('end-search');

        let startId = parseInt(startInput.dataset.id, 10);
        let endId = parseInt(endInput.dataset.id, 10);

        // Tenter de résoudre startId
        if (!startId || isNaN(startId)) {
            const startName = startInput.value.trim().toLowerCase();
            startId = stationNameToId[startName];
            if (startId) {
                startInput.dataset.id = startId;
            } else {
                alert(`La station de départ "${startInput.value}" est invalide.`);
                return;
            }
        }

        // Tenter de résoudre endId
        if (!endId || isNaN(endId)) {
            const endName = endInput.value.trim().toLowerCase();
            endId = stationNameToId[endName];
            if (endId) {
                endInput.dataset.id = endId;
            } else {
                alert(`La station d'arrivée "${endInput.value}" est invalide.`);
                return;
            }
        }

        // Validation des IDs obtenus
        if (startId === endId) {
            alert('Les stations de départ et d\'arrivée doivent être différentes.');
            return;
        }

        // Calcul et affichage du chemin
        const path = GRAPH_LOADED.getShortestPath(startId, endId);
        if (path.length > 0) {
            displayPathResults(path);
            zoomToPath(path);
            highlightPath(path);
        } else {
            alert('Aucun chemin trouvé entre les stations sélectionnées.');
        }

        const acpmContainer = document.querySelector('.acpm-container');
        acpmContainer.classList.remove('show');
        acpmContainer.style.display = 'none';
    });

    clearButton.addEventListener('click', () => {
        clearPath();

        const acpmContainer = document.querySelector('.acpm-container');
        acpmContainer.classList.remove('show');
        acpmContainer.style.display = 'none';
    });
}

/**
 * Affiche les résultats du chemin dans la liste prévue à cet effet.
 * @param {Array} path - La liste des IDs des nœuds sur le chemin.
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

        if (!edge) continue; // Sécurité

        finalTime += edge.travel_time;
        totalTime += edge.travel_time;

        const nextLine = GRAPH_LOADED.nodes[next].line_number;

        // Détecter un changement de ligne ou si c'est la fin du chemin
        if (nextLine !== currentLine || i === path.length - 2) {
            const li = document.createElement('li');
            li.classList.add('result-item');

            // Badge de la ligne
            const lineBadge = document.createElement('span');
            lineBadge.classList.add('line-badge');
            lineBadge.textContent = currentLine.includes('bis') ? currentLine.replace('bis', 'b') : currentLine;
            lineBadge.style.backgroundColor = lineColors[currentLine] || '#000000';

            // Informations sur les arrêts
            const stationInfo = document.createElement('span');
            stationInfo.classList.add('station-info');
            stationInfo.textContent = `${GRAPH_LOADED.nodes[startPoint].station_name} → ${GRAPH_LOADED.nodes[next].station_name}`;

            // Informations sur le temps
            const timeInfo = document.createElement('span');
            timeInfo.classList.add('time-info');
            timeInfo.textContent = `${secondesToTime(totalTime)}`;

            li.appendChild(lineBadge);
            li.appendChild(stationInfo);
            li.appendChild(timeInfo);

            resultsList.appendChild(li);

            // Réinitialiser pour le segment suivant
            totalTime = 0;
            startPoint = next;
            currentLine = nextLine;
        }
    }

    // Ajouter le temps total
    const liTotal = document.createElement('li');
    liTotal.classList.add('result-total');
    liTotal.textContent = `⏰ Temps total : ${secondesToTime(finalTime)}`;
    resultsList.appendChild(liTotal);

    // Afficher le container avec animation
    resultsContainer.style.display = 'block';
    setTimeout(() => {
        resultsContainer.classList.add('show');
    }, 10); // Petit délai pour assurer la transition

    // Optionnel : Scroll automatique vers le bas des résultats
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
}

/**
 * Fait un zoom sur le chemin trouvé afin de centrer la vue sur ce dernier.
 * @param {Array} path - La liste des IDs des nœuds sur le chemin.
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

    const svg = d3.select('.graph-container svg'); // Sélectionner le SVG dans .graph-container
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
 * @param {Array} path - La liste des IDs des nœuds sur le chemin.
 */
function highlightPath(path) {
    const links = document.querySelectorAll('.link');
    const nodes = document.querySelectorAll('.node');

    // Griser toutes les arêtes et les nœuds par défaut
    links.forEach(link => {
        link.style.stroke = "gray"; // Griser l'arête
        link.style.strokeWidth = 1; // Réinitialiser l'épaisseur
        link.style.opacity = 0.5; // Atténuer la visibilité
    });

    nodes.forEach(node => {
        node.style.fill = "gray"; // Griser le nœud
        node.style.stroke = "none"; // Supprimer le contour
        node.style.strokeWidth = "0"; // Réinitialiser l'épaisseur du contour
        node.style.opacity = "0.5"; // Atténuer la visibilité
    });

    // Mettre en évidence les arêtes sur le chemin
    links.forEach(link => {
        const sourceId = parseInt(link.getAttribute('source'), 10);
        const targetId = parseInt(link.getAttribute('target'), 10);

        // Vérifier si cette arête fait partie du chemin
        for (let i = 0; i < path.length - 1; i++) {
            if (
                (sourceId === path[i] && targetId === path[i + 1]) ||
                (sourceId === path[i + 1] && targetId === path[i])
            ) {
                // Obtenir le numéro de ligne à partir du nœud source
                const sourceNode = GRAPH_LOADED.nodes[sourceId];
                const lineNumber = sourceNode.line_number;

                // Définir la couleur de l'arête selon le numéro de ligne
                link.style.stroke = lineColors[lineNumber] || "#000000";
                link.style.strokeWidth = 3; // Épaisseur des arêtes du chemin
                link.style.opacity = 1; // Chemin bien visible
                break; // Sortir de la boucle une fois trouvé
            }
        }
    });

    // Mettre en évidence les nœuds sur le chemin
    nodes.forEach(node => {
        const nodeId = parseInt(node.getAttribute('data-id'), 10);
        if (path.includes(nodeId)) {
            // Obtenir le numéro de ligne du nœud
            const currentNode = GRAPH_LOADED.nodes[nodeId];
            const lineNumber = currentNode.line_number;

            // Définir la couleur du nœud selon le numéro de ligne
            node.style.fill = lineColors[lineNumber] || "#000000";
            node.style.opacity = 1; // Nœud bien visible
            node.style.strokeWidth = 2; // Épaisseur du contour
            node.style.stroke = "#FFFFFF"; // Exemple de contour blanc
        }
    });
}

/**
 * Met en place le comportement du bouton ACPM.
 */
function setupACPMButton() {
    const acpmButton = document.getElementById('acpm');

    acpmButton.addEventListener('click', () => {
        // Vérifier si l'ACPM a déjà été calculé et mis en évidence
        if (GRAPH_LOADED.mst && GRAPH_LOADED.mst.length > 0) {
            // Si oui, réinitialiser les couleurs avant de recalculer
            resetACPMHighlight();
        }

        // Exécuter l'algorithme ACPM (par exemple, Kruskal)
        const { mst, totalWeight } = GRAPH_LOADED.kruskal();

        // Stocker le résultat dans l'objet GRAPH_LOADED pour éviter de recalculer
        GRAPH_LOADED.mst = mst;
        GRAPH_LOADED.totalWeight = totalWeight;

        // Mettre en évidence les arêtes de l'ACPM en rouge
        highlightACPM(mst);

        // make acpm-container visible
        const acpmContainer = document.querySelector('.acpm-container');
        acpmContainer.style.display = 'block';
        acpmContainer.classList.add('show');

        // Afficher le poids total de l'ACPM
        const acpmWeight = document.getElementById('acpm-weight');
        acpmWeight.textContent = `${secondesToTime(totalWeight)}`;
    });
}

/**
 * Met en évidence les arêtes de l'ACPM en rouge.
 * @param {Array} mst - La liste des arêtes de l'ACPM.
 */
function highlightACPM(mst) {
    // Sélectionner toutes les arêtes du graphe
    const allLinks = d3.selectAll('.link');

    // Mettre toutes les arêtes en gris par défaut
    allLinks.style('stroke', '#ccc')
            .style('stroke-width', 1);

    // Mettre en évidence les arêtes de l'ACPM en rouge
    mst.forEach(edge => {
        // Trouver la ligne correspondant à cette arête
        allLinks.filter(d => 
            (d.source.vertex_id === edge.vertex1_id && d.target.vertex_id === edge.vertex2_id) ||
            (d.source.vertex_id === edge.vertex2_id && d.target.vertex_id === edge.vertex1_id)
        )
        .style('stroke', 'red')
        .style('stroke-width', 3);
    });
}

/**
 * Réinitialise la mise en évidence de l'ACPM en restaurant les couleurs d'origine.
 */
function resetACPMHighlight() {
    // Sélectionner toutes les arêtes du graphe
    const allLinks = d3.selectAll('.link');

    // Réinitialiser les arêtes à leur couleur d'origine
    allLinks.style('stroke', d => lineColors[d.source.line_number] || "#000000")
            .style('stroke-width', 1);
}

/**
 * Réinitialise les champs de saisie.
 */
function resetInputFields() {
    const inputFields = ['start-search', 'end-search'];
    inputFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.value = ''; 
            input.dataset.id = ''; 
        }
    });
}

/**
 * Efface le chemin, réinitialise la vue du graphe et restaure les couleurs d'origine.
 */
function clearPath() {
    const links = document.querySelectorAll('.link');
    const nodes = document.querySelectorAll('.node');

    // Réinitialiser l'apparence des liens
    links.forEach(link => {
        const sourceId = parseInt(link.getAttribute('source'), 10);
        const sourceNode = GRAPH_LOADED.nodes[sourceId];
        const linkColor = lineColors[sourceNode.line_number] || "#000000";
        link.style.stroke = linkColor;
        link.style.strokeWidth = "1";
        link.style.opacity = "1";
    });

    // Réinitialiser l'apparence des nœuds
    nodes.forEach(node => {
        const nodeId = parseInt(node.getAttribute('data-id'), 10);
        const currentNode = GRAPH_LOADED.nodes[nodeId];
        if (currentNode) {
            const nodeColor = lineColors[currentNode.line_number] || "#000000";
            node.style.fill = nodeColor;
            node.style.stroke = "none";
            node.style.strokeWidth = "0";
            node.style.opacity = "1";
        }
    });

    // Cacher les résultats avec animation
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
        resultsContainer.classList.remove('show');
        setTimeout(() => {
            resultsContainer.style.display = 'none';
        }, 500); // Correspond à la durée de la transition
    }

    // Réinitialiser les champs de saisie
    resetInputFields();

    // Réinitialiser la mise en évidence de l'ACPM si elle a été effectuée
    if (GRAPH_LOADED.mst && GRAPH_LOADED.mst.length > 0) {
        resetACPMHighlight();
        GRAPH_LOADED.mst = []; // Réinitialiser la liste de l'ACPM
        GRAPH_LOADED.totalWeight = 0;
    }
}
