class Node {
    constructor(vertex_id, station_name, line_number, is_terminus, branch) {
        this.vertex_id = vertex_id;
        this.station_name = station_name;
        this.line_number = line_number;
        this.is_terminus = is_terminus;
        this.branch = branch;
    }
}

class Edge {
    constructor(vertex1_id, vertex2_id, travel_time) {
        this.vertex1_id = vertex1_id;
        this.vertex2_id = vertex2_id;
        this.travel_time = travel_time;
    }
}

class Parser {
    static METRO_FILE_PATH = "Data/metro.txt";
    static POSPOINTS_FILE_PATH = "Data/pospoints.txt";

    constructor() {
        this.nodes = {}; // Store nodes as an object where keys are vertex IDs
        this.edges = []; // Store edges as an array of Edge objects
        this.posPoints = []; // Store position points
        this.vertexCount = 0;
        this.init();
    }

    async init() {
        await this.loadData(Parser.METRO_FILE_PATH);
        await this.loadData(Parser.POSPOINTS_FILE_PATH);
        this.updateVertexCount();
    }

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

                // Create Node object and store it in the nodes collection
                this.nodes[vertex_id] = new Node(vertex_id, station_name, line_number, is_terminus, branch);
            }
        }
    }

    parseEdge(line) {
        line = line.substring(2).trim();
        const parts = line.split(' ');

        if (parts.length >= 3) {
            const vertex1_id = parts[0];
            const vertex2_id = parts[1];
            const travel_time = parseInt(parts[2], 10);
    
            // Create Edge object and store it in the edges array
            this.edges.push(new Edge(vertex1_id, vertex2_id, travel_time));
        }
    }

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

    updateVertexCount() {
        this.vertexCount = Object.keys(this.nodes).length;
    }
}
