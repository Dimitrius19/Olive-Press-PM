import type { VercelRequest, VercelResponse } from "@vercel/node";

// Eurostat Statistics API (JSON-stat format) — free, no key required
async function fetchEurostat(indicatorCode: string, sAdj = "NSA") {
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sts_copi_q?geo=EL&indic_bt=${indicatorCode}&s_adj=${sAdj}&unit=I15&freq=Q&lastTimePeriod=12`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eurostat ${res.status}`);
  return res.json();
}

// Eurostat CPI/HICP for Greece
async function fetchEurostatCPI() {
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_midx?geo=EL&coicop=CP00&unit=I15&freq=M&lastTimePeriod=24`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eurostat CPI ${res.status}`);
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // Construction Cost Index (overall)
  try {
    results.constructionCostIndex = await fetchEurostat("CC");
  } catch (e: unknown) {
    errors.push(`Construction Cost Index: ${(e as Error).message}`);
  }

  // Construction Cost — Materials component
  try {
    results.materialPriceIndex = await fetchEurostat("CC_E01");
  } catch (e: unknown) {
    errors.push(`Material Price Index: ${(e as Error).message}`);
  }

  // Construction Cost — Labour component
  try {
    results.labourCostIndex = await fetchEurostat("CC_E02");
  } catch (e: unknown) {
    errors.push(`Labour Cost Index: ${(e as Error).message}`);
  }

  // Greece CPI (HICP) from Eurostat
  try {
    results.cpiGreece = await fetchEurostatCPI();
  } catch (e: unknown) {
    errors.push(`Greece CPI: ${(e as Error).message}`);
  }

  return res.status(200).json({
    data: results,
    errors,
    fetchedAt: new Date().toISOString(),
  });
}
