import type { NextConfig } from "next"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? ""

const nextConfig: NextConfig = {
  basePath,
  output: "standalone",
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 25,
  },
}

export default nextConfig
