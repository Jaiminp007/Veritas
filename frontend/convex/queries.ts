import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const latestSuccessfulTraceId = async (db: any) => {
  const records = await db
    .query("auditRecords")
    .filter((q: any) => q.eq(q.field("status"), "success"))
    .collect();
  if (records.length === 0) {
    return null;
  }
  records.sort((a: any, b: any) => b.created_at - a.created_at);
  return records[0].trace_id ?? null;
};

const successfulRecords = async (db: any) => {
  const traceId = await latestSuccessfulTraceId(db);
  if (!traceId) {
    return [];
  }
  return await db
    .query("auditRecords")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("status"), "success"),
        q.eq(q.field("trace_id"), traceId),
      ),
    )
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
    const records = await successfulRecords(db);
    return records.sort((a, b) => b.created_at - a.created_at);
  },
});

export const patchRecord = mutation({
  args: {
    id: v.id("auditRecords"),
    patch: v.object({
      baseline_hallucination_detected: v.optional(v.boolean()),
      baseline_hallucination_reason: v.optional(v.string()),
      baseline_hallucination_penalty: v.optional(v.float64()),
      baseline_ncs: v.optional(v.float64()),
      baseline_raw_ncs: v.optional(v.float64()),
      senso_hallucination_detected: v.optional(v.boolean()),
      senso_hallucination_reason: v.optional(v.string()),
      senso_hallucination_penalty: v.optional(v.float64()),
      narrative_control_score: v.optional(v.float64()),
      raw_ncs: v.optional(v.float64()),
      ncs_delta: v.optional(v.float64()),
      citation_match: v.optional(v.float64()),
      key_fact_coverage: v.optional(v.float64()),
      error_message: v.optional(v.string()),
    }),
  },
  handler: async ({ db }, { id, patch }) => {
    await db.patch(id, patch);
    return id;
  },
});
