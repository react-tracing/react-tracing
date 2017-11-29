// @flow
import Stack from "../stack";

describe("stack", () => {
	it("should throw an error if is no element to peek on", () => {
		const s = new Stack();
		expect(() => {
			s.peek();
		}).toThrowErrorMatchingSnapshot();
	});

	it("should return the element on top of the stack if there is an element", () => {
		const s = new Stack();
		s.push(3);
		expect(s.peek()).toBe(3);
	});

	it("should remove the element on top", () => {
		const s = new Stack();
		s.push(1);
		s.push(2);
		s.push(3);

		expect(s.pop()).toBe(3);
		expect(s.peek()).toBe(2);
	});

	it("should remove an element given", () => {
		const s = new Stack();
		s.push(1);
		s.push(2);
		s.push(3);

		expect(s.length).toBe(3);
		s.remove(2);
		expect(s.length).toBe(2);
		expect(s.peek()).toBe(3);
	});
});
