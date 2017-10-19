describe("Basic", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text("Basic")).tap();
  });

  it("should have welcome screen", async () => {
    await expect(element(by.id("basicButton"))).toBeVisible();
    await expect(element(by.id("buttonLabel"))).toBeVisible();
    await expect(element(by.text("Not Pressed"))).toBeVisible();
    await element(by.id("basicButton")).tap();
    await expect(element(by.text("Pressed"))).toBeVisible();
  });
});
