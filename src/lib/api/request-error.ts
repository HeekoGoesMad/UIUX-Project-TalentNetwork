import { NextResponse } from "next/server";

export function apiError(message: string, status: number, cause?: unknown) {
  const errorId = crypto.randomUUID().slice(0, 8);
  if (cause === undefined) console.error(`[${errorId}] ${message}`);
  else console.error(`[${errorId}] ${message}`, cause);
  return NextResponse.json({ error: message, errorId }, { status });
}
