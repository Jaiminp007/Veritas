import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const writeRecord = mutation({
  args: {
    record: v.object({
      trace_id: v.string(),
      query_id: v.string(),
      category: v.string(),
      query_text: v.string(),
      ground_truth_answer: v.string(),
      key_facts: v.array(v.string()),
      source_document: v.string(),
      baseline_response: v.string(),
      baseline_hallucination_detected: v.boolean(),
      baseline_hallucination_reason: v.string(),
      baseline_hallucination_penalty: v.float64(),
      baseline_ncs: v.float64(),
      baseline_raw_ncs: v.float64(),
      senso_response: v.string(),
      senso_citations: v.array(v.string()),
      senso_hallucination_detected: v.boolean(),
      senso_hallucination_reason: v.string(),
      senso_hallucination_penalty: v.float64(),
      narrative_control_score: v.float64(),
      raw_ncs: v.float64(),
      ncs_delta: v.float64(),
      citation_match: v.float64(),
      key_fact_coverage: v.float64(),
      weights_used: v.object({
        alpha: v.float64(),
        beta: v.float64(),
        delta: v.float64(),
      }),
      latency_ms: v.float64(),
      status: v.union(v.literal("success"), v.literal("failed")),
      error_message: v.optional(v.string()),
      created_at: v.number(),
    }),
  },
  handler: async ({ db }, { record }) => {
    return await db.insert("auditRecords", record);
  },
});
