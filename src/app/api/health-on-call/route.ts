import { NextResponse } from "next/server";
import { getHealthOnCall } from "@/lib/health-on-call";
import { PUBLIC_CACHE_CONTROL } from "@/lib/public-cache";

/** Repli 1 h. La publication garde appelle revalidatePath("/api/health-on-call"). */
export const revalidate = 3600;

export async function GET() {
  const data = await getHealthOnCall();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": PUBLIC_CACHE_CONTROL,
    },
  });
}
