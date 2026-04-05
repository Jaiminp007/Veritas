import { NextResponse } from "next/server"

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000"

export async function POST(request: Request) {
  let body: { query?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 })
  }

  if (!body.query || typeof body.query !== "string" || body.query.trim().length < 5) {
    return NextResponse.json(
      { detail: "Query must be at least 5 characters." },
      { status: 400 },
    )
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    const res = await fetch(`${FASTAPI_URL}/playground/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: body.query.trim() }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { detail: "Request timed out. The backend may be under heavy load." },
        { status: 504 },
      )
    }
    return NextResponse.json(
      { detail: "Failed to reach the backend service." },
      { status: 502 },
    )
  }
}
