function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeNet(gross: number, tare: number): number {
  return round2(gross - tare);
}

export function derivePercent(net: number, weight: number): number {
  if (net === 0) return 0;
  return round2((weight / net) * 100);
}

export interface CalcInput {
  grossWeight: number;
  tareWeight: number;
  dustWeight?: number | null;
  moistureWeight?: number | null;
  dustExcluded?: boolean;
  moistureExcluded?: boolean;
}

export interface CalcResult {
  netWeight: number;
  dustWeight: number | null;
  dustPercent: number | null;
  moistureWeight: number | null;
  moisturePercent: number | null;
  dustExcluded: boolean;
  moistureExcluded: boolean;
  deduction: number;
  finalWeight: number;
}

export function computeAll(input: CalcInput): CalcResult {
  const net = computeNet(input.grossWeight, input.tareWeight);

  const dw = input.dustWeight != null && input.dustWeight !== 0 ? input.dustWeight : null;
  const mw = input.moistureWeight != null && input.moistureWeight !== 0 ? input.moistureWeight : null;

  const dustExcluded = input.dustExcluded ?? false;
  const moistureExcluded = input.moistureExcluded ?? false;

  const dustPercent = dw != null && net !== 0 ? derivePercent(net, dw) : null;
  const moisturePercent = mw != null && net !== 0 ? derivePercent(net, mw) : null;

  const includedDust = !dustExcluded ? (dw ?? 0) : 0;
  const includedMoisture = !moistureExcluded ? (mw ?? 0) : 0;
  const deduction = Math.max(includedDust, includedMoisture);

  const finalWeight = round2(net - deduction);

  return {
    netWeight: net,
    dustWeight: dw,
    dustPercent,
    moistureWeight: mw,
    moisturePercent,
    dustExcluded,
    moistureExcluded,
    deduction,
    finalWeight,
  };
}
