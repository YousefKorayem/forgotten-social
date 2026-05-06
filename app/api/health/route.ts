import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";

const READY_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export async function GET() {
  try {
    await dbConnect();
    const state = mongoose.connection.readyState;
    return NextResponse.json({
      status: "ok",
      db: {
        state: READY_STATES[state] ?? "unknown",
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}