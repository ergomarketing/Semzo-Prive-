export async function POST() {
  console.log("[SMS BLOCKED] duplicate OTP avoided")
  return new Response(JSON.stringify({ skipped: true }), { status: 200 })
}
