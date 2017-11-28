"use strict";
//@flow
exports.__esModule = true;
/**
 *  Class represeting a stack
 */
var Stack = /** @class */ (function() {
	/**
	 * Create a stack
	 *
	 * @constructor
	 */
	function Stack() {
		this.list = [];
	}
	/**
	 * Adds an item to the stack
	 *
	 * @name push
	 * @function
	 * @param {T} item The item to add
	 */
	Stack.prototype.push = function(item) {
		this.list.push(item);
	};
	/**
	 * Removes and returns the first item from the stack
	 *
	 * @name pop
	 * @function
	 * @returns {T} The last added item
	 */
	Stack.prototype.pop = function() {
		return this.list.pop();
	};
	/**
	 * Returns the topmost item
	 *
	 * @name peek
	 * @function
	 * @returns {T} The last added item
	 */
	Stack.prototype.peek = function() {
		if (!this.list.length) {
			throw new Error("No items in stack");
		}
		return this.list[this.list.length - 1];
	};
	/**
	 * Removes an item from the stack
	 *
	 * @name remove
	 * @function
	 * @param {T} item the item to remove
	 */
	Stack.prototype.remove = function(item) {
		this.list = this.list.filter(function(x) {
			return x !== item;
		});
	};
	Object.defineProperty(Stack.prototype, "length", {
		/**
		 * The amount of items in the stack
		 *
		 * @name length
		 * @function
		 * @returns {Number} number of items in stack
		 */
		get: function() {
			return this.list.length;
		},
		enumerable: true,
		configurable: true
	});
	return Stack;
})();
exports["default"] = Stack;
