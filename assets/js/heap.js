class MinHeap {
    /**
     * Classe représentant une structure de tas binaire minimum (MinHeap).
     */
    constructor() {
        /**
         * Initialiser un tas vide.
         * @property {Array} heap - Tableau interne représentant le tas.
         */
        this.heap = [];
    }

    /**
     * Ajouter un élément au tas.
     * @param {Object} element - L'élément à ajouter. Il doit avoir une propriété `distance` pour comparer les priorités.
     */
    push(element) {
        this.heap.push(element);
        this._heapifyUp();
    }

    /**
     * Extraire et retourner l'élément racine (le plus petit) du tas.
     * @returns {Object|null} L'élément racine extrait, ou `null` si le tas est vide.
     */
    pop() {
        if (this.heap.length === 0) return null;

        const root = this.heap[0];
        const lastElement = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = lastElement;
            this._heapifyDown();
        }
        return root;
    }

    /**
     * Obtenir la taille actuelle du tas.
     * @returns {number} Le nombre d'éléments dans le tas.
     */
    size() {
        return this.heap.length;
    }

    /**
     * Réorganiser le tas après l'ajout d'un élément pour maintenir la propriété de tas.
     * @private
     */
    _heapifyUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].distance < this.heap[parentIndex].distance) {
                [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    /**
     * Réorganiser le tas après la suppression de la racine pour maintenir la propriété de tas.
     * @private
     */
    _heapifyDown() {
        let index = 0;
        const len = this.heap.length;
        while (index < len) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
            let smallest = index;

            if (leftChildIndex < len && this.heap[leftChildIndex].distance < this.heap[smallest].distance) {
                smallest = leftChildIndex;
            }

            if (rightChildIndex < len && this.heap[rightChildIndex].distance < this.heap[smallest].distance) {
                smallest = rightChildIndex;
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }
}
