// Wiki CCN không sử dụng Edge Functions. Runtime này chỉ giữ endpoint đóng để
// healthcheck của bộ Supabase chính thức ổn định mà không tải package bên ngoài.
Deno.serve(() =>
  new Response(JSON.stringify({ error: "Edge Functions are disabled" }), {
    status: 404,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  }),
)
