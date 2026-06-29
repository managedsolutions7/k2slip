import { computeNet, derivePercent, computeAll } from "../calc";

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

describe("derivePercent", () => {
  it("computes percent from weight and net", () => {
    expect(derivePercent(3000, 150)).toBe(5);
  });

  it("returns 0 when net is 0", () => {
    expect(derivePercent(0, 150)).toBe(0);
  });

  it("rounds to 2 decimals", () => {
    expect(derivePercent(7000, 233.1)).toBe(3.33);
  });
});

describe("computeAll", () => {
  it("both dust and moisture included — deducts the larger one", () => {
    const result = computeAll({
      grossWeight: 28500,
      tareWeight: 12000,
      dustWeight: 200,
      moistureWeight: 150,
    });
    expect(result.netWeight).toBe(16500);
    expect(result.dustWeight).toBe(200);
    expect(result.dustPercent).toBe(1.21);
    expect(result.moistureWeight).toBe(150);
    expect(result.moisturePercent).toBe(0.91);
    expect(result.deduction).toBe(200);
    expect(result.finalWeight).toBe(16300);
  });

  it("no dust or moisture — final equals net", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustWeight).toBeNull();
    expect(result.dustPercent).toBeNull();
    expect(result.moistureWeight).toBeNull();
    expect(result.moisturePercent).toBeNull();
    expect(result.deduction).toBe(0);
    expect(result.finalWeight).toBe(3000);
  });

  it("only dust, no moisture — deducts dust", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      dustWeight: 150,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustWeight).toBe(150);
    expect(result.dustPercent).toBe(5);
    expect(result.moistureWeight).toBeNull();
    expect(result.deduction).toBe(150);
    expect(result.finalWeight).toBe(2850);
  });

  it("only moisture, no dust — deducts moisture", () => {
    const result = computeAll({
      grossWeight: 15400,
      tareWeight: 6200,
      moistureWeight: 300,
    });
    expect(result.netWeight).toBe(9200);
    expect(result.dustWeight).toBeNull();
    expect(result.moistureWeight).toBe(300);
    expect(result.moisturePercent).toBe(3.26);
    expect(result.deduction).toBe(300);
    expect(result.finalWeight).toBe(8900);
  });

  it("dust excluded — deducts only moisture", () => {
    const result = computeAll({
      grossWeight: 22100,
      tareWeight: 9800,
      dustWeight: 180,
      moistureWeight: 250,
      dustExcluded: true,
    });
    expect(result.netWeight).toBe(12300);
    expect(result.dustWeight).toBe(180);
    expect(result.dustExcluded).toBe(true);
    expect(result.moistureExcluded).toBe(false);
    expect(result.deduction).toBe(250);
    expect(result.finalWeight).toBe(12050);
  });

  it("moisture excluded — deducts only dust", () => {
    const result = computeAll({
      grossWeight: 41000,
      tareWeight: 16500,
      dustWeight: 400,
      moistureWeight: 400,
      moistureExcluded: true,
    });
    expect(result.netWeight).toBe(24500);
    expect(result.moistureExcluded).toBe(true);
    expect(result.deduction).toBe(400);
    expect(result.finalWeight).toBe(24100);
  });

  it("both excluded — no deduction", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      dustWeight: 100,
      moistureWeight: 200,
      dustExcluded: true,
      moistureExcluded: true,
    });
    expect(result.netWeight).toBe(3000);
    expect(result.dustWeight).toBe(100);
    expect(result.moistureWeight).toBe(200);
    expect(result.deduction).toBe(0);
    expect(result.finalWeight).toBe(3000);
  });

  it("equal dust and moisture — deduction equals that value", () => {
    const result = computeAll({
      grossWeight: 10000,
      tareWeight: 5000,
      dustWeight: 300,
      moistureWeight: 300,
    });
    expect(result.deduction).toBe(300);
    expect(result.finalWeight).toBe(4700);
  });

  it("zero dust/moisture treated as null", () => {
    const result = computeAll({
      grossWeight: 5000,
      tareWeight: 2000,
      dustWeight: 0,
      moistureWeight: 0,
    });
    expect(result.dustWeight).toBeNull();
    expect(result.moistureWeight).toBeNull();
    expect(result.deduction).toBe(0);
    expect(result.finalWeight).toBe(3000);
  });

  it("blank dust and moisture (null values)", () => {
    const result = computeAll({
      grossWeight: 30200,
      tareWeight: 12050,
      dustWeight: null,
      moistureWeight: null,
    });
    expect(result.netWeight).toBe(18150);
    expect(result.dustWeight).toBeNull();
    expect(result.moistureWeight).toBeNull();
    expect(result.deduction).toBe(0);
    expect(result.finalWeight).toBe(18150);
  });

  it("derives percent correctly when net is non-zero", () => {
    const result = computeAll({
      grossWeight: 10000,
      tareWeight: 3000,
      dustWeight: 233.1,
      moistureWeight: 543.9,
    });
    expect(result.netWeight).toBe(7000);
    expect(result.dustPercent).toBe(3.33);
    expect(result.moisturePercent).toBe(7.77);
    expect(result.deduction).toBe(543.9);
    expect(result.finalWeight).toBe(6456.1);
  });

  it("handles net = 0 — no percent derived", () => {
    const result = computeAll({
      grossWeight: 2000,
      tareWeight: 2000,
      dustWeight: 100,
    });
    expect(result.netWeight).toBe(0);
    expect(result.dustWeight).toBe(100);
    expect(result.dustPercent).toBeNull();
    expect(result.deduction).toBe(100);
    expect(result.finalWeight).toBe(-100);
  });
});
