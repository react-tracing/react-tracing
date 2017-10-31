require("babel-polyfill");
import fetch from "node-fetch";

const getTraceAmount = () =>
  fetch("http://localhost:9411/api/v2/traces")
    .then(res => res.json())
    .then(res => res.length);

describe("Basic", () => {
  describe("Setup", () => {
    it("should be able to access zipkin", async () => {
      const response = await fetch("http://localhost:9411/api/v2/traces");
      expect(response.status).to.equal(200);
    });

    it("should be able interact with the basic example", async () => {
      const before = await getTraceAmount();

      cy.visit("/");
      cy.get("#Basic").click();
      cy.get("#buttonLabel").should($p => {
        expect($p.first()).to.contain("Not-Pressed");
      });
      cy.get("#basicButton").click();
      cy.get("#buttonLabel").should(async $p => {
        expect($p.first()).to.contain("Is-Pressed");
        const after = await getTraceAmount();
        expect(after - before).to.equal(1);
      });
    });
  });
});
