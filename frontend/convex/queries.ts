import { query } from "./_generated/server";
import { v } from "convex/values";

const successfulRecords = async (db: any) => {
  return await db
    .query("auditRecords")
    .filter((q: any) => q.eq(q.field("status"), "success"))
    .collect();
};

const baselineNcs = (record: any) => record.baseline_ncs ?? record.baseline_ncs_proxy ?? 0;

const baselineHallucinationDetected = (record: any) =>
  record.baseline_hallucination_detected ?? record.baseline_hallucinated ?? false;

const sensoHallucinationDetected = (record: any) =>
  record.senso_hallucination_detected ?? record.hallucination_detected ?? false;

const ncsDelta = (record: any) =>
  record.ncs_delta ?? (record.narrative_control_score ?? 0) - baselineNcs(record);

export const getSummary = query({
  args: {},
  handler: async ({ db }) => {
    const records = await successfulRecords(db);
    if (records.length === 0) {
      return null;
    }
    const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    return {
      total: records.length,
      avg_senso_ncs: avg(records.map((record: any) => record.narrative_control_score)),
      avg_baseline_ncs: avg(records.map((record: any) => baselineNcs(record))),
      avg_delta: avg(records.map((record: any) => ncsDelta(record))),
      hallucination_rate_baseline:
        records.filter((record: any) => baselineHallucinationDetected(record)).length / records.length,
      hallucination_rate_senso:
        records.filter((record: any) => sensoHallucinationDetected(record)).length / records.length,
      citation_accuracy: avg(records.map((record: any) => record.citation_match)),
    };
  },
});

export const getByCategory = query({
  args: {},
  handler: async ({ db }) => {
    const records = await successfulRecords(db);
    const grouped = new Map<string, any[]>();
    for (const record of records) {
      const current = grouped.get(record.category) ?? [];
      current.push(record);
      grouped.set(record.category, current);
    }

    return [...grouped.entries()].map(([category, rows]) => {
      const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
      return {
        category,
        avg_senso_ncs: avg(rows.map((row) => row.narrative_control_score)),
        avg_baseline_ncs: avg(rows.map((row) => baselineNcs(row))),
        avg_delta: avg(rows.map((row) => ncsDelta(row))),
        count: rows.length,
      };
    });
  },
});

export const getAll = query({
  args: {},
  handler: async ({ db }) => {
    const records = await db.query("auditRecords").collect();
    return records.sort((a, b) => b.created_at - a.created_at);
  },
});
