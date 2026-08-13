import type { Metadata } from "next"
import Link from "next/link"
import { CircleHelpIcon, MessageCircleQuestionIcon } from "lucide-react"

import { WikiMarkdown } from "@/components/wiki-markdown"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { listPublishedFaq } from "@/lib/faq-repository"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Câu hỏi thường gặp",
  description: "Giải đáp các câu hỏi thường gặp khi chơi mod Minecraft Cổ Chân Nhân.",
}

export default async function FaqPage() {
  const entries = await listPublishedFaq()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>FAQ</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-8 flex flex-col gap-4 rounded-2xl border bg-card px-6 py-8 shadow-sm sm:px-10">
        <Badge variant="outline" className="w-fit">
          <CircleHelpIcon data-icon="inline-start" /> Hỗ trợ người chơi
        </Badge>
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Câu hỏi thường gặp</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Câu trả lời được quản lý trực tiếp trên Supabase và cập nhật ngay khi quản trị viên xuất bản.
          </p>
        </div>
      </header>

      {entries.length ? (
        <Accordion className="rounded-2xl border bg-card px-5 sm:px-7">
          {entries.map((entry) => (
            <AccordionItem key={entry.id} value={`faq-${entry.id}`}>
              <AccordionTrigger>
                <span className="flex min-w-0 items-center gap-3 text-left">
                  <Badge variant="secondary">{entry.category}</Badge>
                  <span>{entry.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <WikiMarkdown content={entry.answer.split("\n")} />
                {entry.faq_media.length && supabaseUrl ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {entry.faq_media.map((media) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={media.id}
                        src={`${supabaseUrl}/storage/v1/object/public/wiki-assets/${media.object_path.split("/").map(encodeURIComponent).join("/")}`}
                        alt={media.alt_text || entry.question}
                        loading="lazy"
                        className="max-h-96 w-full rounded-xl border object-contain"
                      />
                    ))}
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageCircleQuestionIcon /></EmptyMedia>
            <EmptyTitle>Chưa có câu hỏi được xuất bản</EmptyTitle>
            <EmptyDescription>Quản trị viên có thể thêm nội dung từ trang quản trị FAQ.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  )
}
