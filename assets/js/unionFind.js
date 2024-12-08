class UnionFind {
    /**
     * Classe représentant une structure Union-Find (ou structure de disjoint-set).
     * Permet de gérer des ensembles disjoints avec des opérations efficaces de recherche et union.
     * @param {number} size - Le nombre initial d'éléments (0 à size-1).
     */
    constructor(size) {
        /**
         * Tableau représentant le parent direct de chaque élément.
         * Chaque élément est initialement son propre parent.
         * @type {Array<number>}
         */
        this.parent = Array(size).fill(null).map((_, index) => index);

        /**
         * Tableau des rangs, utilisé pour optimiser les unions par rang.
         * @type {Array<number>}
         */
        this.rank = Array(size).fill(0);
    }

    /**
     * Trouver la racine de l'ensemble auquel appartient l'élément `x`.
     * Cette méthode utilise la compression de chemin pour accélérer les recherches futures.
     * @param {number} x - L'élément dont on cherche la racine.
     * @returns {number} La racine de l'ensemble contenant `x`.
     */
    find(x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]); // Compression de chemin
        }
        return this.parent[x];
    }

    /**
     * Fusionner les ensembles contenant les éléments `x` et `y`.
     * Cette méthode utilise l'union par rang pour minimiser la profondeur des arbres.
     * @param {number} x - Un élément du premier ensemble.
     * @param {number} y - Un élément du second ensemble.
     */
    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX !== rootY) {
            // Union par rang : attache l'arbre le moins profond sous l'autre
            if (this.rank[rootX] > this.rank[rootY]) {
                this.parent[rootY] = rootX;
            } else if (this.rank[rootX] < this.rank[rootY]) {
                this.parent[rootX] = rootY;
            } else {
                this.parent[rootY] = rootX;
                this.rank[rootX]++;
            }
        }
    }
}
