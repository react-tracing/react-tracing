describe("Basic", () => {
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
});
