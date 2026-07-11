type DataPoint = { date: string; value: number };

function linearRegression(data: DataPoint[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.value ?? 0 };

  const xMean = (n - 1) / 2;
  const yMean = data.reduce((sum, p) => sum + p.value, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].value;
    numerator += (x - xMean) * (y - yMean);
    denominator += (x - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

export function predictNextDays(
  history: DataPoint[],
  days: number = 30,
): DataPoint[] {
  if (history.length === 0) return [];

  const { slope, intercept } = linearRegression(history);
  const lastDate = new Date(history[history.length - 1].date);
  const predictions: DataPoint[] = [];

  for (let i = 1; i <= days; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);
    const x = history.length - 1 + i;
    const predictedValue = slope * x + intercept;
    predictions.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(predictedValue * 100) / 100,
    });
  }

  return predictions;
}

export function computeForecast(
  series: { date: string; price: number }[],
  days: number = 30,
): {
  history: { date: string; price: number }[];
  prediction: { date: string; price: number }[];
} {
  const history = series.map((p) => ({ date: p.date, value: p.price }));
  const prediction = predictNextDays(history, days);
  return {
    history: series.slice(-30),
    prediction: prediction.map((p) => ({ date: p.date, price: p.value })),
  };
}
