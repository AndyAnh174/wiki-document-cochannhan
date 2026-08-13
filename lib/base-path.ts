export const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? ""

export function withBasePath(source?: string) {
  if (!source || !basePath || !source.startsWith("/")) return source
  if (source === basePath || source.startsWith(`${basePath}/`)) return source
  return `${basePath}${source}`
}
