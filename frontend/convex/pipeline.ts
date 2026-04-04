import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const jobArgs = v.object({
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
});

export const createJob = mutation({
  args: {
    job: jobArgs,
  },
  handler: async ({ db }, { job }) => {
    return await db.insert("pipelineJobs", job);
  },
});

export const updateJob = mutation({
  args: {
    job_id: v.string(),
    patch: jobArgs,
  },
  handler: async ({ db }, { job_id, patch }) => {
    const existing = await db
      .query("pipelineJobs")
      .filter((q) => q.eq(q.field("job_id"), job_id))
      .collect();
    if (existing.length === 0) {
      return null;
    }
    await db.patch(existing[0]._id, patch);
    return existing[0]._id;
  },
});

export const getJob = query({
  args: {
    job_id: v.string(),
  },
  handler: async ({ db }, { job_id }) => {
    const jobs = await db
      .query("pipelineJobs")
      .filter((q) => q.eq(q.field("job_id"), job_id))
      .collect();
    return jobs[0] ?? null;
  },
});

export const listJobs = query({
  args: {},
  handler: async ({ db }) => {
    const jobs = await db.query("pipelineJobs").collect();
    return jobs.sort((a, b) => b.updated_at - a.updated_at);
  },
});
