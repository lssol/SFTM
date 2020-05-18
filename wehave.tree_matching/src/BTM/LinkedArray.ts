const head = Symbol("head")

type LinkedListNode<T> = {
    value: T
    next: LinkedListNode<T>,
    previous: LinkedListNode<T>,
}

export class LinkedList<T> implements Iterable<T> {
    private head: LinkedListNode<T> = null
    private tail: LinkedListNode<T> = null

    private valueNodeMap = new Map<T, LinkedListNode<T>>()
    public length = 0

    constructor(values: Iterable<T> = []) {
        for (let value of values) {
            this.append(value)
        }
    }

    public append = (value: T): LinkedList<T> => {
        this.length++
        const node = this.forgeNode(value)
        this.valueNodeMap.set(value, node)

        if (this.isEmpty()) {
            this.head = node
            this.tail = node
            return this
        }

        this.appendToTheEndOfTheList(node)
        return this
    }

    public isEmpty = () => !this.head

    public toArray = (): T[] => {
        const result: T[] = []
        let node = this.head
        while (node) {
            result.push(node.value)
            node = node.next
        }
        return result
    }

    public *values() {
        let node = this.head
        while (node) {
            yield node.value
            node = node.next
        }
    }

    public delete = (value: T) => {
        const node = this.valueNodeMap.get(value)
        if (node == null)
            return false
        if (node.next == null && node.previous == null) {
            this.head = null
            this.tail = null
        } else if (node.next == null) {
            this.tail = node.previous
            node.previous.next = null
        } else if (node.previous == null) {
            this.head = node.next
            node.next.previous = null
        } else {
            node.previous.next = node.next
            node.next.previous = node.previous
        }

        this.valueNodeMap.set(value, null)
        this.length -= 1

        return true
    }

    private appendToTheEndOfTheList = (node: LinkedListNode<T>) => {
        node.previous = this.tail
        this.tail.next = node
        this.tail = node
    }

    private forgeNode = (value: T): LinkedListNode<T> => {
        return { value, next: null, previous: null }
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this.values()
    }
}
