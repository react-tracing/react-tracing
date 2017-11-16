describe("async stacks", () => {
  /* ┌──┴───┐
  *  │Fetch1│───────────────┐
  *  └──┬───┘               ▼
  *  ┌──┴───┐               Λ
  *  │Fetch2│──────────┐   ╱ ╲
  *  └──┬───┘       ┌──┼──▕ 1 ▏
  *  ┌──┴──────┐    │  │   ╲ ╱
  *  │Response1│◀───┘  ▼    V
  *  └──┬──────┘       Λ
  *  ┌──┴──────┐      ╱ ╲
  *  │Response2│◀────▕ 2 ▏
  *  └──┬──────┘      ╲ ╱
  *     ▼              V
  */
  it(
    "should trace correcly with spans that return while others are still in progress"
  );

  /* ┌──┴───┐
  * │Fetch1│──────────────────┐
  * └──┬───┘     ┌─────▶      ▼
  * ┌──┴───┐     │      Λ     Λ
  * │Fetch2│─────┘     ╱ ╲   ╱ ╲
  * └──┬───┘      ┌───▕ 2 ▏ ▕ 1 ▏
  * ┌──┴──────┐   │    ╲ ╱   ╲ ╱
  * │Response2│◀──┘     V     V
  * └──┬──────┘               │
  * ┌──┴──────┐               │
  * │Response1│◀──────────────┘
  * └──┬──────┘
  *    ▼
  */
  it("should trace correcly with nested spans");
});
