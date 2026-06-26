function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeNet(gross: number, tare: number): number {
  return round2(gross - tare);
}

export function dustWeightFromPercent(
  net: number,
  dustPercent: number
): number {
  return round2(net * (dustPercent / 100));
}

export function dustPercentFromWeight(
  net: number,
  dustWeight: number
): number {
  if (net === 0) return 0;
  return round2((dustWeight / net) * 100);
}

export function moistureWeightFromPercent(
  net: number,
  moisturePercent: number
): number {
  return round2(net * (moisturePercent / 100));
}

export function moisturePercentFromWeight(
  net: number,
  moistureWeight: number
): number {
  if (net === 0) return 0;
  return round2((moistureWeight / net) * 100);
}

export function computeFinal(
  net: number,
  dustWeight: number | null,
  moistureWeight: number | null
): number {
  return round2(net - (dustWeight ?? 0) - (moistureWeight ?? 0));
}

export interface CalcInput {
  grossWeight: number;
  tareWeight: number;
  dustPercent?: number | null;
  dustWeight?: number | null;
  moisturePercent?: number | null;
  moistureWeight?: number | null;
}

export interface CalcResult {
  netWeight: number;
  dustPercent: number | null;
  dustWeight: number | null;
  moisturePercent: number | null;
  moistureWeight: number | null;
  finalWeight: number;
}

export function computeAll(input: CalcInput): CalcResult {
  const net = computeNet(input.grossWeight, input.tareWeight);

  let dPercent: number | null = null;
  let dWeight: number | null = null;

  if (input.dustPercent != null && input.dustPercent !== 0) {
    dPercent = input.dustPercent;
    dWeight = dustWeightFromPercent(net, input.dustPercent);
  } else if (input.dustWeight != null && input.dustWeight !== 0) {
    dWeight = input.dustWeight;
    dPercent = dustPercentFromWeight(net, input.dustWeight);
  }

  let mPercent: number | null = null;
  let mWeight: number | null = null;

  if (input.moisturePercent != null && input.moisturePercent !== 0) {
    mPercent = input.moisturePercent;
    mWeight = moistureWeightFromPercent(net, input.moisturePercent);
  } else if (input.moistureWeight != null && input.moistureWeight !== 0) {
    mWeight = input.moistureWeight;
    mPercent = moisturePercentFromWeight(net, input.moistureWeight);
  }

  const finalWeight = computeFinal(net, dWeight, mWeight);

  return {
    netWeight: net,
    dustPercent: dPercent,
    dustWeight: dWeight,
    moisturePercent: mPercent,
    moistureWeight: mWeight,
    finalWeight,
  };
}
