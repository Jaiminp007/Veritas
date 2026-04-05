type ConvexQueryResponse<T> = {
  status: "success" | "error";
  value?: T;
  errorMessage?: string;
};

export type SummaryMetrics = {
  total: number;
  avg_senso_ncs: number;
  avg_baseline_ncs: number;
  avg_delta: number;
  hallucination_rate_baseline: number;
  hallucination_rate_senso: number;
  citation_accuracy: number;
};

export type CategoryMetrics = {
  category: string;
  avg_senso_ncs: number;
  avg_baseline_ncs: number;
  avg_delta: number;
  count: number;
};

export type AuditRecord = {
  _id: string;
  trace_id: string;
  query_id: string;
  category: string;
  query_text: string;
  baseline_response: string;
  senso_response: string;
  baseline_hallucination_detected: boolean;
  baseline_hallucination_reason: string;
  senso_hallucination_detected: boolean;
  senso_hallucination_reason: string;
  senso_citations: string[];
  narrative_control_score: number;
  ncs_delta: number;
  citation_match: number;
  latency_ms: number;
  status: "success" | "failed";
  created_at: number;
};

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.VITE_CONVEX_URL ??
  process.env.CONVEX_URL;

const apiBase = convexUrl?.replace(/\/$/, "");

async function runQuery<T>(path: string, args: Record<string, unknown> = {}): Promise<T | null> {
  if (!apiBase) {
    return null;
  }

  try {
    const response = await fetch(`${apiBase}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args, format: "json" }),
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as ConvexQueryResponse<T>;
    if (payload.status !== "success" || payload.value === undefined) {
      return null;
    }
    return payload.value;
  } catch {
    return null;
  }
}

export async function getSummaryMetrics(): Promise<SummaryMetrics | null> {
  return runQuery<SummaryMetrics>("queries:getSummary");
}

export async function getCategoryMetrics(): Promise<CategoryMetrics[]> {
  const rows = await runQuery<CategoryMetrics[]>("queries:getByCategory");
  return rows ?? [];
}

export async function getAuditRecords(limit = 50): Promise<AuditRecord[]> {
  const rows = await runQuery<any[]>("queries:getAll");
  if (!rows) {
    return [];
  }
  return rows
    .filter((row) => row.status === "success")
    .map((row) => ({
      _id: String(row._id),
      trace_id: String(row.trace_id ?? ""),
      query_id: String(row.query_id ?? ""),
      category: String(row.category ?? "Unknown"),
      query_text: String(row.query_text ?? ""),
      baseline_response: String(row.baseline_response ?? ""),
      senso_response: String(row.senso_response ?? ""),
      baseline_hallucination_detected: Boolean(
        row.baseline_hallucination_detected ?? row.baseline_hallucinated ?? false,
      ),
      baseline_hallucination_reason: String(row.baseline_hallucination_reason ?? ""),
      senso_hallucination_detected: Boolean(
        row.senso_hallucination_detected ?? row.hallucination_detected ?? false,
      ),
      senso_hallucination_reason: String(
        row.senso_hallucination_reason ?? row.hallucination_reason ?? "",
      ),
      senso_citations: Array.isArray(row.senso_citations) ? row.senso_citations.map(String) : [],
      narrative_control_score: Number(row.narrative_control_score ?? 0),
      ncs_delta: Number(row.ncs_delta ?? row.narrative_control_score - (row.baseline_ncs ?? row.baseline_ncs_proxy ?? 0)),
      citation_match: Number(row.citation_match ?? 0),
      latency_ms: Number(row.latency_ms ?? 0),
      status: row.status === "failed" ? "failed" : "success",
      created_at: Number(row.created_at ?? 0),
    }))
    .slice(0, limit);
}
