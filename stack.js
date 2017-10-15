class Stack {
  constructor() {
    this.list = [];
  }

  push(item) {
    this.list.push(item);
  }

  pop() {
    return this.list.pop();
  }

  peek() {
    if (!this.list.length) {
      throw new Error("No items in stack");
    }

    return this.list[this.list.length - 1];
  }
}

module.exports = Stack;
