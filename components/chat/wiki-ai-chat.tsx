"use client"

import { FormEvent, KeyboardEvent, useRef, useState } from "react"
import Link from "next/link"
import { BotIcon, PlusIcon, SendIcon, SparklesIcon, UserIcon } from "lucide-react"

import { ChatMarkdown } from "@/components/chat/chat-markdown"
import { withBasePath } from "@/lib/base-path"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type Source = {
  title: string
  chapter_idx?: number
  score?: number
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  error?: boolean
}

const SESSION_STORAGE = "ccn-wiki-ai-conversation-v1"
const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Chào đạo hữu! Ta có thể tra cứu **Cổ trùng**, **Cổ phương**, **Sát chiêu**, Đạo ngân và các cơ chế trong bản mod. Hãy hỏi bằng tiếng Việt nhé.",
}

const suggestions = [
  "Cách đặt Cổ cho sát chiêu Bách Luyện?",
  "Hướng dẫn luyện Cổ bằng Cổ phương",
  "Đạo ngân ảnh hưởng sát thương thế nào?",
]

export function WikiAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function conversationId() {
    return localStorage.getItem(SESSION_STORAGE)
  }

  function newConversation() {
    abortRef.current?.abort()
    localStorage.removeItem(SESSION_STORAGE)
    setMessages([welcomeMessage])
    setInput("")
    setIsStreaming(false)
  }

  async function submitQuestion(question: string) {
    const cleanQuestion = question.trim()
    if (cleanQuestion.length < 2 || isStreaming) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleanQuestion,
    }
    const assistantId = crypto.randomUUID()
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ])
    setInput("")
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await fetch(withBasePath("/api/wiki-chat")!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: cleanQuestion,
          conversation_id: conversationId(),
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? `Chatbot trả về lỗi ${response.status}.`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      const updateAssistant = (update: Partial<ChatMessage>) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, ...update } : message
          )
        )
      }

      const appendText = (text: string) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + text }
              : message
          )
        )
      }

      const handleBlock = (block: string) => {
        const lines = block.replaceAll("\r", "").split("\n")
        const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim()
        const data = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n")
        if (!data || event === "done") return
        try {
          const parsed: unknown = JSON.parse(data)
          if (event === "sources" && Array.isArray(parsed))
            updateAssistant({ sources: parsed as Source[] })
          else if (
            event === "conversation" &&
            typeof parsed === "object" &&
            parsed !== null &&
            "conversation_id" in parsed &&
            typeof parsed.conversation_id === "string"
          )
            localStorage.setItem(SESSION_STORAGE, parsed.conversation_id)
          else if (
            typeof parsed === "object" &&
            parsed !== null &&
            "text" in parsed &&
            typeof parsed.text === "string"
          )
            appendText(parsed.text)
        } catch {
          // Bỏ qua event SSE không đúng JSON thay vì làm gián đoạn câu trả lời.
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const blocks = buffer.split(/\n\n/)
        buffer = blocks.pop() ?? ""
        blocks.forEach(handleBlock)
      }
      buffer += decoder.decode()
      if (buffer.trim()) handleBlock(buffer)

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && !message.content
            ? { ...message, content: "Chatbot chưa trả về nội dung. Bạn thử hỏi lại nhé.", error: true }
            : message
        )
      )
    } catch (error) {
      if (controller.signal.aborted) return
      const message = error instanceof Error ? error.message : "Không thể kết nối chatbot."
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: message, error: true }
            : item
        )
      )
    } finally {
      if (!controller.signal.aborted) setIsStreaming(false)
      abortRef.current = null
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitQuestion(input)
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submitQuestion(input)
    }
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <SparklesIcon data-icon="inline-start" />
        AI
      </SheetTrigger>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full gap-0 p-0 sm:max-w-xl md:max-w-2xl"
      >
        <SheetHeader className="border-b pr-14">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="flex items-center gap-2 font-serif text-lg">
                <BotIcon /> Trợ lý Cổ Chân Nhân
              </SheetTitle>
              <SheetDescription>Tra cứu trực tiếp từ 39 chương Wiki Minecraft.</SheetDescription>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={newConversation} title="Cuộc trò chuyện mới">
              <PlusIcon />
              <span className="sr-only">Cuộc trò chuyện mới</span>
            </Button>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1">
          <MessageScrollerProvider>
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-5 p-4 pb-8">
                  {messages.length === 1 ? (
                    <MessageScrollerItem>
                      <Empty className="border">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><SparklesIcon /></EmptyMedia>
                          <EmptyTitle>Hỏi Wiki bằng AI</EmptyTitle>
                          <EmptyDescription>Chọn một câu hỏi mẫu hoặc nhập câu hỏi của bạn bên dưới.</EmptyDescription>
                        </EmptyHeader>
                        <div className="flex flex-col gap-2 px-4 pb-4">
                          {suggestions.map((suggestion) => (
                            <Button key={suggestion} variant="outline" className="h-auto justify-start whitespace-normal text-left" onClick={() => void submitQuestion(suggestion)}>
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </Empty>
                    </MessageScrollerItem>
                  ) : null}

                  {messages.map((message, index) => (
                    <MessageScrollerItem key={message.id} scrollAnchor={index === messages.length - 1}>
                      <Message align={message.role === "user" ? "end" : "start"}>
                        <MessageAvatar>
                          {message.role === "user" ? <UserIcon /> : <BotIcon />}
                        </MessageAvatar>
                        <MessageContent>
                          <MessageHeader>{message.role === "user" ? "Bạn" : "Wiki AI"}</MessageHeader>
                          <Bubble
                            align={message.role === "user" ? "end" : "start"}
                            variant={message.error ? "destructive" : message.role === "user" ? "default" : "muted"}
                          >
                            <BubbleContent>
                              {message.content ? (
                                message.role === "assistant" ? <ChatMarkdown content={message.content} /> : <p className="whitespace-pre-wrap">{message.content}</p>
                              ) : (
                                <span className="flex items-center gap-2 text-muted-foreground"><Spinner /> Đang tra cứu Wiki…</span>
                              )}
                            </BubbleContent>
                          </Bubble>
                          {message.sources?.length ? (
                            <MessageFooter className="flex-wrap gap-1.5">
                              <span>Nguồn:</span>
                              {message.sources.map((source) => {
                                const slug = source.title.replace(/\.md$/i, "")
                                return (
                                  <Button key={`${message.id}-${source.title}`} variant="link" size="xs" render={<Link href={`/${slug}`} />}>
                                    {source.title}
                                  </Button>
                                )
                              })}
                            </MessageFooter>
                          ) : null}
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        <form onSubmit={onSubmit} className="border-t p-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="wiki-ai-question" className="sr-only">Câu hỏi cho Wiki AI</FieldLabel>
              <div className="flex items-end gap-2">
                <Textarea
                  id="wiki-ai-question"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder="Hỏi về Cổ trùng, Sát chiêu, Cổ phương…"
                  rows={2}
                  maxLength={2000}
                  disabled={isStreaming}
                  className="max-h-36 min-h-12 resize-none"
                />
                <Button type="submit" size="icon" disabled={isStreaming || input.trim().length < 2}>
                  {isStreaming ? <Spinner /> : <SendIcon />}
                  <span className="sr-only">Gửi câu hỏi</span>
                </Button>
              </div>
              <FieldDescription>Enter để gửi · Shift + Enter để xuống dòng</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </SheetContent>
    </Sheet>
  )
}
