/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { withBasePath } from "@/lib/base-path"
import { cn } from "@/lib/utils"

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="font-serif text-xl font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="font-serif text-lg font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="font-serif text-base font-semibold">{children}</h3>,
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          a: ({ href = "", children }) => {
            const internal = href.endsWith(".md")
            const nextHref = internal
              ? `/${href.split("/").pop()?.slice(0, -3)}`
              : href
            if (nextHref.startsWith("/"))
              return <Link href={nextHref} className="font-medium underline underline-offset-4">{children}</Link>
            return (
              <a href={nextHref} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                {children}
              </a>
            )
          },
          pre: ({ children }) => (
            <pre className="max-w-full overflow-x-auto rounded-lg border bg-background/70 p-3 font-mono text-xs leading-5">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const block = className?.startsWith("language-")
            return (
              <code className={cn(block ? className : "rounded bg-muted px-1 py-0.5 font-mono text-xs")}>
                {children}
              </code>
            )
          },
          table: ({ children }) => (
            <div className="max-w-full overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b bg-muted px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
          hr: () => <div className="h-px bg-border" role="separator" />,
          img: ({ src, alt }) => {
            if (typeof src !== "string" || src.startsWith("data:")) return null
            return <img src={withBasePath(src)} alt={alt ?? ""} loading="lazy" className="max-h-72 rounded-lg border object-contain" />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
