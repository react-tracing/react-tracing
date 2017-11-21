//@flow

class Stack<T> {
	list: Array<T>;

	constructor() {
		this.list = [];
	}

	push(item: T) {
		this.list.push(item);
	}

	pop(): T {
		return this.list.pop();
	}

	peek(): T {
		if (!this.list.length) {
			throw new Error("No items in stack");
		}

		return this.list[this.list.length - 1];
	}
}

module.exports = Stack;
