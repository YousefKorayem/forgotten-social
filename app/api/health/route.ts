import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

const READY_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export async function GET() {
  try {
    await dbConnect();
    const userCount = await User.estimatedDocumentCount();
    const state = mongoose.connection.readyState;
    return NextResponse.json({
      status: "ok",
      db: {
        state: READY_STATES[state] ?? "unknown",
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      models: Object.keys(mongoose.models),
      userCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}