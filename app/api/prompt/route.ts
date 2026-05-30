import { NextResponse } from "next/server";

const fakeResults = [
  "I drafted a simple action plan, identified the first milestone, and queued the next step for review.",
  "I analyzed the request and found three likely paths. The fastest one is ready to prototype.",
  "I turned that into a concise brief with goals, assumptions, risks, and a suggested execution order.",
  "I prepared a mock output with enough structure to connect a real model or workflow API later.",
  "I mapped the task into research, planning, implementation, and validation phases."
];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: unknown } | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const result = fakeResults[Math.floor(Math.random() * fakeResults.length)];

  return NextResponse.json({
    prompt,
    result: `${result} Prompt received: "${prompt}"`
  });
}
