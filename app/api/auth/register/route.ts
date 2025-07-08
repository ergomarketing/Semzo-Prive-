// app/api/auth/register/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { registerUser } from "@/app/lib/registerUser";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const result = await registerUser(data);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
