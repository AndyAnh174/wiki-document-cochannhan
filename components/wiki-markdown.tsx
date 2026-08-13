/* eslint-disable @next/next/no-img-element */
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { withBasePath } from "@/lib/base-path"

export function WikiMarkdown({ content }: { content: string[] }) {
  return (
    <article className="wiki-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const nextHref = href?.endsWith(".md")
              ? `/${href.slice(0, -3)}`
              : href
            return <a href={withBasePath(nextHref)}>{children}</a>
          },
          img: ({ src, alt }) => {
            if (typeof src !== "string" || src.startsWith("data:")) return null
            return <img src={withBasePath(src)} alt={alt ?? ""} loading="lazy" />
          },
        }}
      >
        {content.join("\n")}
      </ReactMarkdown>
    </article>
  )
}
