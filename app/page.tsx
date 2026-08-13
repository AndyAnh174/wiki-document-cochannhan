import Image from "next/image"
import Link from "next/link"
import {
  BookOpenIcon,
  BugIcon,
  FlaskConicalIcon,
  MapIcon,
  ScrollTextIcon,
  SparklesIcon,
  SwordsIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getWikiNavigation } from "@/lib/wiki"
import { withBasePath } from "@/lib/base-path"

const features = [
  {
    title: "Cổ trùng",
    description:
      "Tra cứu phân loại, công dụng, cách nuôi và hơn một nghìn công thức hợp luyện.",
    icon: BugIcon,
    image: "/mod-assets/items/an-jian-gu.png",
    href: "/catalog/gu",
  },
  {
    title: "Sát chiêu",
    description:
      "Cách đặt cổ đúng vị trí, kiểm tra điều kiện và vận hành trận hình sát chiêu.",
    icon: SwordsIcon,
    image: "/mod-assets/items/sat-chieu-scroll.png",
    href: "/catalog/killer-moves",
  },
  {
    title: "Luyện đạo",
    description:
      "Nguyên liệu, quy trình, xác suất thành công và những lỗi thường gặp khi luyện cổ.",
    icon: FlaskConicalIcon,
    image: "/mod-assets/items/gu-fang.png",
    href: "/catalog/gu",
  },
  {
    title: "Ngũ vực",
    description:
      "Khám phá khu vực, thế lực, bí cảnh, tài nguyên và hệ sinh thái trong mod.",
    icon: MapIcon,
    image: "/mod-assets/blocks/gu-material.png",
    href: "/catalog/creatures",
  },
] as const

export default function Home() {
  const navigation = getWikiNavigation()

  return (
    <main className="min-h-[calc(100svh-3.5rem)]">
      <section className="relative isolate overflow-hidden border-b">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_75%_20%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_42%)]" />
        <div className="hero-grid absolute inset-0 -z-10 opacity-35" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-5 border-primary/30 bg-primary/5 text-primary"
            >
              <SparklesIcon data-icon="inline-start" /> Bách khoa mod Guzhenren
            </Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Vạn cổ quy nguyên,
              <span className="block text-primary">đạo tại trong tay.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Cẩm nang tiếng Việt tổng hợp cơ chế, cổ trùng, sát chiêu và thế
              giới của bản mod Cổ Chân Nhân — được đối chiếu trực tiếp từ source
              mod.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/early-game-guide" />}>
                <BookOpenIcon data-icon="inline-start" /> Bắt đầu khám phá
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/catalog/killer-moves" />}
              >
                <ScrollTextIcon data-icon="inline-start" /> Xem hướng dẫn sát
                chiêu
              </Button>
            </div>
          </div>
          <div className="relative min-h-64 lg:min-h-96">
            <div className="absolute inset-6 rounded-full bg-primary/10 blur-3xl" />
            <Image
              src={withBasePath("/mod-assets/screens/five-regions.png")!}
              alt="Năm quyển trục đại diện cho Ngũ Vực"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-contain drop-shadow-[0_28px_24px_rgba(40,20,5,0.22)]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [navigation.length, "chương hướng dẫn"],
            ["1.107+", "công thức luyện cổ"],
            ["68", "sát chiêu đã kiểm chứng"],
            ["347", "hiệu ứng tu luyện"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-xl border bg-card/70 px-5 py-4 shadow-xs"
            >
              <div className="font-serif text-2xl font-semibold text-primary">
                {value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-14 mb-7">
          <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">
            Tra cứu nhanh
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Bước vào thế giới cổ sư
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <Image
                    src={withBasePath(feature.image)!}
                    alt=""
                    width={46}
                    height={46}
                    className="pixel-art size-12 object-contain transition-transform group-hover:scale-110"
                  />
                </div>
                <CardTitle className="font-serif text-xl">
                  {feature.title}
                </CardTitle>
                <CardDescription className="leading-6">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={feature.href}
                  className="text-sm font-medium text-primary after:absolute after:inset-0"
                >
                  Mở chương <span aria-hidden>→</span>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-14 overflow-hidden border-primary/20 bg-primary/[0.035]">
          <div className="grid items-center md:grid-cols-[1fr_280px]">
            <CardHeader className="p-7 md:p-10">
              <Badge className="mb-3 w-fit">Dành cho người mới</Badge>
              <CardTitle className="font-serif text-2xl md:text-3xl">
                Không biết nên bắt đầu từ đâu?
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                Đi theo lộ trình từ chọn tư chất, khai khiếu, tăng cảnh giới đến
                con đường luyện cổ đầu tiên. Mỗi bước đều có chỉ dẫn thao tác
                trong game.
              </CardDescription>
              <Button
                className="mt-3 w-fit"
                variant="secondary"
                render={<Link href="/gameplay-flow" />}
              >
                Xem lộ trình tân thủ
              </Button>
            </CardHeader>
            <div className="relative hidden h-full min-h-64 md:block">
              <Image
                src={withBasePath("/mod-assets/screens/killer-move-scroll.png")!}
                alt="Cổ thư sát chiêu trong mod"
                fill
                sizes="280px"
                className="object-cover object-left opacity-85"
              />
            </div>
          </div>
        </Card>
      </section>
    </main>
  )
}
