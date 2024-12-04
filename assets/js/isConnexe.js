async function isConnexe() {
    const matrix = await initAdjacencyMatrix();
    const visited = new Array(matrix.length).fill(false);

    function dfs(node) {
        visited[node] = true;

        for (let i = 0; i < matrix[node].length; i++) {
            if (matrix[node][i] !== 0 && !visited[i]) {
                dfs(i);
            }
        }
    }

    dfs(0);

    console.log('Tableau des nœuds visités :', visited);
    return visited.every(v => v);
}

// Appeler isConnexe correctement
(async () => {
    const isGraphConnected = await isConnexe();
    console.log('Le graphe est connexe :', isGraphConnected);
})();
