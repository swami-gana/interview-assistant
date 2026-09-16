import Anthropic from "@anthropic-ai/sdk";
import type { QuickFacts } from "./types";
import type { Candidate } from "./types";

export const SNAPSHOT_SYSTEM_PROMPT = `You extract structured research records from raw interview notes for a
qualitative user research team working on a meditation app.

You will receive the interviewer's post-call summary of a short user
interview. Return a JSON object and nothing else — no preamble, no
markdown fences, no commentary.

Shape:
{
  "summary": string,
  "opportunities": string[]
}

"summary" is a single paragraph, 3-6 sentences, describing what this
person said in the call. Written in plain past tense about the
participant. Cover what they use the app for, what is working, and what
is not. Do not editorialise and do not add anything the notes do not
support.

"opportunities" is a list of user needs, pain points, or desires that
the participant expressed.

Rules for opportunities, these matter more than anything else:
- Phrase each one as a situation or an activity, not as a solution.
  Use gerund form where the phrasing allows.
  Good: "accessing practices without an internet connection"
  Good: "finding a practice short enough for a work break"
  Bad: "add offline downloads"
  Bad: "the app should have a 5-minute practice filter"
- Keep each one short, roughly 4-12 words.
- Stay in the participant's own framing. Use their language and their
  emphasis rather than restating it in product terms.
- Preserve the nuance of what they actually said. If they described a
  specific condition or context, keep it.
- Include only what the notes support. Never infer an opportunity the
  participant did not express.
- If the notes contain no opportunities, return an empty array. Never
  invent one to fill the list.`;

export type LlmSnapshotPayload = {
  summary: string;
  opportunities: string[];
};

export function buildQuickFacts(candidate: Candidate, interviewDate: string): QuickFacts {
  return {
    name: candidate.name,
    ageGroup: candidate.ageGroup,
    region: candidate.region,
    meditatorStatus: candidate.meditatorStatus,
    occupation: candidate.occupation,
    interviewDate,
  };
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

export function parseLlmSnapshotResponse(raw: string): LlmSnapshotPayload {
  const cleaned = stripMarkdownFences(raw);
  const parsed = JSON.parse(cleaned) as Partial<LlmSnapshotPayload>;
  if (
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.opportunities) ||
    !parsed.opportunities.every((o) => typeof o === "string")
  ) {
    throw new Error("Invalid LLM response shape");
  }
  return {
    summary: parsed.summary,
    opportunities: parsed.opportunities,
  };
}

export async function generateSnapshotFromSummary(
  postCallSummary: string
): Promise<LlmSnapshotPayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.LLM_MODEL ?? "claude-sonnet-4-6";
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY missing");
  }
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    system: SNAPSHOT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: postCallSummary }],
  });
  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text in LLM response");
  }
  return parseLlmSnapshotResponse(block.text);
}
