import {
  computeNet,
  dustWeightFromPercent,
  dustPercentFromWeight,
  moistureWeightFromPercent,
  moisturePercentFromWeight,
  computeFinal,
  computeAll,
} from "../calc";

describe("computeNet", () => {
  it("subtracts tare from gross", () => {
    expect(computeNet(5000, 2000)).toBe(3000);
  });

  it("handles decimal weights", () => {
    expect(computeNet(5000.5, 2000.3)).toBe(3000.2);
  });

  it("returns 0 when gross equals tare", () => {
    expect(computeNet(2000, 2000)).toBe(0);
  });
});

describe("dust conversions", () => {
  it("computes dust weight from percent", () => {
    expect(dustWeightFromPercent(3000, 5)).toBe(150);
  });

  it("computes dust percent from weight", () => {
    expect(dustPercentFromWeight(3000, 150)).toBe(5);
  });

  it("handles zero net for percent from weight", () => {
    expect(dustPercentFromWeight(0, 150)).toBe(0);
  });

  it("rounds to 2 decimals", () => {
    expect(dustWeightFromPercent(3000, 3.33)).toBe(99.9);
  });
});

describe("moisture conversions", () => {
  it("computes moisture weight from percent", () => {
    expect(moistureWeightFromPercent(3000, 10)).toBe(300);
  });

  it("computes moisture percent from weight", () => {
    expect(moisturePercentFromWeight(3000, 300)).toBe(10);
  });

  it("handles zero net for percent from weight", () => {
    expect(moisturePercentFromWeight(0, 300)).toBe(0);
  });
});

describe("computeFinal", () => {
  it("deducts both dust and moisture", () => {
    expect(computeFinal(3000, 150, 300)).toBe(2550);
  });

  it("handles null dust", () => {
    expect(computeFinal(3000, null, 300)).toBe(2700);
  });

  it("handles null moisture", () => {
    expect(computeFinal(3000, 150, null)).toBe(2850);
  });

  it("returns net when both are null", () => {
    expect(computeFinal(3000, null, null)).toBe(3000);
  });
});

describe("computeAll", () => {
  it("full calculation with dust % and moisture %", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      dustPercent: 5,
      moisturePercent: 10,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustWeight).toBe(150);
    expect(result.dustPercent).toBe(5);
    expect(result.moistureWeight).toBe(300);
    expect(result.moisturePercent).toBe(10);
    expect(result.finalWeight).toBe(2550);
  });

  it("full calculation with dust weight and moisture weight", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      dustWeight: 150,
      moistureWeight: 300,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustPercent).toBe(5);
    expect(result.dustWeight).toBe(150);
    expect(result.moisturePercent).toBe(10);
    expect(result.moistureWeight).toBe(300);
    expect(result.finalWeight).toBe(2550);
  });

  it("no dust or moisture → final equals net", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustPercent).toBeNull();
    expect(result.dustWeight).toBeNull();
    expect(result.moisturePercent).toBeNull();
    expect(result.moistureWeight).toBeNull();
    expect(result.finalWeight).toBe(3000);
  });

  it("only dust %, no moisture", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      dustPercent: 5,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustWeight).toBe(150);
    expect(result.moistureWeight).toBeNull();
    expect(result.finalWeight).toBe(2850);
  });

  it("only moisture weight, no dust", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      moistureWeight: 300,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustWeight).toBeNull();
    expect(result.moisturePercent).toBe(10);
    expect(result.finalWeight).toBe(2700);
  });

  it("handles zero percent as no deduction", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      dustPercent: 0,
      moisturePercent: 0,
    });
    expect(result.dustWeight).toBeNull();
    expect(result.moistureWeight).toBeNull();
    expect(result.finalWeight).toBe(3000);
  });

  it("handles fractional percentages with rounding", () => {
    const result = computeAll({
      grossWeight: 10000,
      tareWeight: 3000,
      dustPercent: 3.33,
      moisturePercent: 7.77,
    });
    expect(result.netWeight).toBe(7000);
    expect(result.dustWeight).toBe(233.1);
    expect(result.moistureWeight).toBe(543.9);
    expect(result.finalWeight).toBe(6223);
  });
});
