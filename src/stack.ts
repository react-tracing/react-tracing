//@flow

/**
 *  Class represeting a stack
 */
class Stack<T> {
	list: Array<T>;

	/**
	 * Create a stack
	 *
	 * @constructor
	 */
	constructor() {
		this.list = [];
	}

	/**
	 * Adds an item to the stack
	 *
	 * @name push
	 * @function
	 * @param {T} item The item to add
	 */
	push(item: T) {
		this.list.push(item);
	}

	/**
	 * Removes and returns the first item from the stack
	 *
	 * @name pop
	 * @function
	 * @returns {T} The last added item
	 */
	pop(): T | undefined {
		return this.list.pop();
	}

	/**
	 * Returns the topmost item
	 *
	 * @name peek
	 * @function
	 * @returns {T} The last added item
	 */
	peek(): T {
		if (!this.list.length) {
			throw new Error("No items in stack");
		}

		return this.list[this.list.length - 1];
	}

	/**
	 * Removes an item from the stack
	 *
	 * @name remove
	 * @function
	 * @param {T} item the item to remove
	 */
	remove(item: T): void {
		this.list = this.list.filter(x => x !== item);
	}

	/**
	 * The amount of items in the stack
	 *
	 * @name length
	 * @function
	 * @returns {Number} number of items in stack
	 */
	get length(): number {
		return this.list.length;
	}
}

export default Stack;
