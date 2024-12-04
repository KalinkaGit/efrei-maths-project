/**
 * Représente un nœud (station) dans le réseau.
 */
class Node {
    /**
     * Crée une instance de Node.
     * @param {string} vertex_id - Identifiant unique du sommet (station).
     * @param {string} station_name - Nom de la station.
     * @param {string} line_number - Numéro de la ligne à laquelle appartient la station.
     * @param {boolean} is_terminus - Indique si la station est un terminus.
     * @param {number} branch - Numéro de la branche pour les lignes avec bifurcations.
     */
    constructor(vertex_id, station_name, line_number, is_terminus, branch) {
        this.vertex_id = vertex_id;
        this.station_name = station_name;
        this.line_number = line_number;
        this.is_terminus = is_terminus;
        this.branch = branch;
    }
}

/**
 * Représente une arête entre deux nœuds (stations) du réseau.
 */
class Edge {
    /**
     * Crée une instance de Edge.
     * @param {string} vertex1_id - Identifiant du premier sommet.
     * @param {string} vertex2_id - Identifiant du deuxième sommet.
     * @param {number} travel_time - Temps de trajet entre les deux sommets (en secondes).
     */
    constructor(vertex1_id, vertex2_id, travel_time) {
        this.vertex1_id = vertex1_id;
        this.vertex2_id = vertex2_id;
        this.travel_time = travel_time;
    }
}

/**
 * Parseur pour charger et interpréter les données d'un réseau de transport.
 */
class Parser {
    /**
     * Chemin par défaut vers le fichier contenant les données du réseau.
     * @type {string}
     */
    static METRO_FILE_PATH = "Data/metro.txt";

    /**
     * Chemin par défaut vers le fichier contenant les points de positionnement.
     * @type {string}
     */
    static POSPOINTS_FILE_PATH = "Data/pospoints.txt";

    /**
     * Initialise une instance de Parser.
     */
    constructor() {
        /**
         * Collection de nœuds (stations), indexée par leurs identifiants.
         * @type {Object<string, Node>}
         */
        this.nodes = {};

        /**
         * Liste des arêtes (connexions entre stations).
         * @type {Array<Edge>}
         */
        this.edges = [];

        /**
         * Liste des points de positionnement.
         * @type {Array<{x: number, y: number, name: string}>}
         */
        this.posPoints = [];

        /**
         * Nombre total de sommets dans le réseau.
         * @type {number}
         */
        this.vertexCount = 0;

        this.init();
    }

    /**
     * Initialise le parseur en chargeant les données des fichiers.
     * @async
     */
    async init() {
        await this.loadData(Parser.METRO_FILE_PATH);
        await this.loadData(Parser.POSPOINTS_FILE_PATH);
        this.updateVertexCount();
    }

    /**
     * Charge et traite les données à partir d'un fichier.
     * @async
     * @param {string} filePath - Chemin vers le fichier à charger.
     */
    async loadData(filePath) {
        try {
            const response = await fetch(filePath);
            const data = await response.text();

            if (filePath === Parser.METRO_FILE_PATH) {
                this.parse(data);
            } else if (filePath === Parser.POSPOINTS_FILE_PATH) {
                this.parsePosPoints(data);
            }
        } catch (error) {
            console.error('Erreur de chargement du fichier:', error);
        }
    }

    /**
     * Parse le contenu d'un fichier pour extraire les stations et connexions.
     * @param {string} fileContent - Contenu du fichier à analyser.
     */
    parse(fileContent) {
        const lines = fileContent.split('\n');
        let found_start = false;

        for (let line of lines) {
            line = line.trim();

            if (line.length === 0) continue;

            if (line.startsWith('V')) {
                if (!found_start) {
                    if (line.startsWith('V 0000')) {
                        found_start = true;
                        this.parseVertex(line);
                    }
                    continue;
                }
                this.parseVertex(line);
            } else if (line.startsWith('E')) {
                if (!found_start) {
                    if (line.startsWith('E 0')) {
                        found_start = true;
                        this.parseEdge(line);
                    }
                    continue;
                }
                this.parseEdge(line);
            }
        }
    }

    /**
     * Parse une ligne pour créer un nœud (station).
     * @param {string} line - Ligne contenant les données d'un sommet.
     */
    parseVertex(line) {
        line = line.substring(2).trim();
        const index = line.indexOf(' ;');

        if (index !== -1) {
            const beforeSemicolon = line.substring(0, index);
            const afterSemicolon = line.substring(index + 2);
            const parts = beforeSemicolon.trim().split(' ');
            const vertex_id = parts[0];
            const station_name = parts.slice(1).join(' ');
            const restParts = afterSemicolon.trim().split(' ;');

            if (restParts.length === 2) {
                const line_number = restParts[0].trim();
                const lastPart = restParts[1].trim();
                const lastParts = lastPart.split(' ');
                const is_terminus = lastParts[0] === 'True';
                const branch = parseInt(lastParts[1], 10);

                this.nodes[vertex_id] = new Node(
                    vertex_id,
                    station_name,
                    line_number,
                    is_terminus,
                    branch
                );
            }
        }
    }

    /**
     * Parse une ligne pour créer une arête entre deux sommets.
     * @param {string} line - Ligne contenant les données d'une arête.
     */
    parseEdge(line) {
        line = line.substring(2).trim();
        const parts = line.split(' ');

        if (parts.length >= 3) {
            const vertex1_id = parts[0];
            const vertex2_id = parts[1];
            const travel_time = parseInt(parts[2], 10);

            this.edges.push(new Edge(vertex1_id, vertex2_id, travel_time));
        }
    }

    /**
     * Parse un fichier contenant des points de positionnement.
     * @param {string} fileContent - Contenu du fichier à analyser.
     */
    parsePosPoints(fileContent) {
        const lines = fileContent.split('\n');
        
        for (let line of lines) {
            line = line.trim();

            if (line.length === 0) continue;

            const parts = line.split(';');

            if (parts.length === 3) {
                const x = parseFloat(parts[0]);
                const y = parseFloat(parts[1]);
                let name = parts[2];

                name = name.replace(/@/g, ' ');

                this.posPoints.push({
                    x,
                    y,
                    name,
                });
            }
        }
    }

    /**
     * Met à jour le nombre total de sommets dans le réseau.
     */
    updateVertexCount() {
        this.vertexCount = Object.keys(this.nodes).length;
    }
}
