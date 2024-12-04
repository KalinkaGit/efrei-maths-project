
class MinHeap {
    constructor() {
        this.heap = [];
    }

    push(element) {
        this.heap.push(element);
        this._heapifyUp();
    }

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

    size() {
        return this.heap.length;
    }

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