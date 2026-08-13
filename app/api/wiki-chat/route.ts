const WIKI_CHAT_URL =
  process.env.WIKI_CHAT_API_URL ??
  "https://ccn.andyanh.id.vn/api/wiki/chat"

export const maxDuration = 120
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { question?: unknown; conversation_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 })
  }

  const question = typeof body.question === "string" ? body.question.trim() : ""
  const conversationId =
    typeof body.conversation_id === "string"
      ? body.conversation_id.slice(0, 512)
      : null

  if (question.length < 2)
    return Response.json({ error: "Câu hỏi cần ít nhất 2 ký tự." }, { status: 400 })
  if (question.length > 2000)
    return Response.json({ error: "Câu hỏi quá dài." }, { status: 400 })

  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  let upstream: Response
  try {
    upstream = await fetch(WIKI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        ...(realIp ? { "X-Real-IP": realIp } : {}),
      },
      body: JSON.stringify({
        question,
        conversation_id: conversationId,
      }),
      cache: "no-store",
      signal: request.signal,
    })
  } catch {
    return Response.json(
      { error: "Chatbot Wiki chưa sẵn sàng. Vui lòng thử lại sau." },
      { status: 502 }
    )
  }

  if (!upstream.ok || !upstream.body) {
    if ([404, 502, 503, 504].includes(upstream.status))
      return Response.json(
        { error: "Wiki AI đang khởi động sau khi triển khai. Vui lòng thử lại sau ít phút." },
        { status: 503 }
      )
    let error = `Chatbot trả về lỗi ${upstream.status}.`
    try {
      const payload = (await upstream.json()) as { detail?: string; error?: string }
      error = payload.detail ?? payload.error ?? error
    } catch {
      // Giữ thông báo mặc định nếu upstream không trả JSON.
    }
    return Response.json({ error }, { status: upstream.status })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
