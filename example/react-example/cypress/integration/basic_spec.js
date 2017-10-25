require("babel-polyfill");
import fetch from "node-fetch";

describe("Basic", () => {
  describe("Setup", () => {
    it("should be able interact with the basic example", () => {
      cy.visit("/");
      cy.get("#Basic").click();
      cy.get("#buttonLabel").should($p => {
        expect($p.first()).to.contain("Not-Pressed");
      });
      cy.get("#basicButton").click();
      cy.get("#buttonLabel").should($p => {
        expect($p.first()).to.contain("Is-Pressed");
      });
    });

    it("should be able to access zipkin", async () => {
      const result = await fetch(
        "http://localhost:9411/api/v1/spans?serviceName=frontend"
      ).then(res => res.json());
      expect(result).to.eql([]);
    });
  });
});
