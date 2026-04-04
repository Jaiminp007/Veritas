import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  auditRecords: defineTable({
    trace_id: v.string(),
    query_id: v.string(),
    category: v.string(),
    query_text: v.string(),
    ground_truth_answer: v.string(),
    key_facts: v.array(v.string()),
    source_document: v.string(),
    baseline_response: v.string(),
    baseline_hallucination_detected: v.optional(v.boolean()),
    baseline_hallucination_reason: v.optional(v.string()),
    baseline_hallucination_penalty: v.optional(v.float64()),
    baseline_ncs: v.optional(v.float64()),
    baseline_raw_ncs: v.optional(v.float64()),
    senso_response: v.string(),
    senso_citations: v.array(v.string()),
    senso_hallucination_detected: v.optional(v.boolean()),
    senso_hallucination_reason: v.optional(v.string()),
    senso_hallucination_penalty: v.optional(v.float64()),
    narrative_control_score: v.float64(),
    raw_ncs: v.optional(v.float64()),
    ncs_delta: v.optional(v.float64()),
    citation_match: v.float64(),
    key_fact_coverage: v.optional(v.float64()),
    weights_used: v.object({
      alpha: v.float64(),
      beta: v.float64(),
      delta: v.float64(),
    }),
    latency_ms: v.float64(),
    status: v.union(v.literal("success"), v.literal("failed")),
    error_message: v.optional(v.string()),
    created_at: v.number(),
    baseline_hallucinated: v.optional(v.boolean()),
    baseline_ncs_proxy: v.optional(v.float64()),
    hallucination_detected: v.optional(v.boolean()),
    hallucination_reason: v.optional(v.string()),
    hallucination_penalty: v.optional(v.float64()),
    remediation_success: v.optional(v.float64()),
  })
    .index("by_trace_id", ["trace_id"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),
  pipelineJobs: defineTable({
    job_id: v.string(),
    trace_id: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed"),
    ),
    total_queries: v.number(),
    completed_queries: v.number(),
    failed_queries: v.number(),
    current_query_id: v.optional(v.string()),
    started_at: v.number(),
    updated_at: v.number(),
    finished_at: v.optional(v.number()),
    error_message: v.optional(v.string()),
  })
    .index("by_job_id", ["job_id"])
    .index("by_trace_id", ["trace_id"])
    .index("by_status", ["status"]),
});
