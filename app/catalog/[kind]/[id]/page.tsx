import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BookOpenIcon,
  FlaskConicalIcon,
  InfoIcon,
  MapPinnedIcon,
} from "lucide-react"

import { CatalogNav } from "@/components/catalog-nav"
import { KillerMoveFormation } from "@/components/killer-move-formation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { catalogDefinitions } from "@/lib/catalog"
import { withBasePath } from "@/lib/base-path"
import { findCatalogRecord } from "@/lib/catalog-repository"
import { catalogKinds, type CatalogKind } from "@/lib/catalog-types"

type PageProps = { params: Promise<{ kind: string; id: string }> }

function isKind(value: string): value is CatalogKind {
  return catalogKinds.includes(value as CatalogKind)
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { kind, id } = await params
  if (!isKind(kind)) return {}
  const record = await findCatalogRecord(kind, decodeURIComponent(id))
  return record ? { title: record.name, description: record.summary } : {}
}

export default async function CatalogDetailPage({ params }: PageProps) {
  const { kind, id: rawId } = await params
  if (!isKind(kind)) notFound()
  const record = await findCatalogRecord(kind, decodeURIComponent(rawId))
  if (!record) notFound()
  const definition = catalogDefinitions[kind]

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <CatalogNav active={kind} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              Trang chủ
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/catalog/${kind}`} />}>
              {definition.shortTitle}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{record.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Button
        variant="ghost"
        className="w-fit"
        render={<Link href={`/catalog/${kind}`} />}
      >
        <ArrowLeftIcon data-icon="inline-start" /> Trở lại danh mục
      </Button>

      <section className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardContent className="flex aspect-square items-center justify-center bg-muted/40 p-8">
            {record.image ? (
              <Image
                src={withBasePath(record.image)!}
                alt={`Ảnh ${record.name}`}
                width={160}
                height={160}
                priority
                className="pixel-art size-40 object-contain drop-shadow-lg"
              />
            ) : (
              <BookOpenIcon className="size-16 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>{record.category}</Badge>
            {record.rank ? (
              <Badge variant="outline">{record.rank}</Badge>
            ) : null}
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
            {record.name}
          </h1>
          <code className="mt-3 w-fit rounded-md bg-muted px-2 py-1 text-xs">
            guzhenren:{record.id}
          </code>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
            {record.summary}
          </p>
        </div>
      </section>

      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Thông tin</TabsTrigger>
          {kind === "gu" ? (
            <TabsTrigger value="recipes">
              Cổ phương ({record.recipes?.length ?? 0})
            </TabsTrigger>
          ) : null}
          {kind === "killer-moves" ? (
            <TabsTrigger value="formation">Vị trí đặt Cổ</TabsTrigger>
          ) : null}
          {kind === "creatures" ? (
            <TabsTrigger value="spawns">Điểm spawn</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="overview" className="pt-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Mô tả và công dụng</CardTitle>
                <CardDescription>
                  Tooltip và ghi chú trích từ bản mod.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {record.details.length ? (
                  record.details.map((detail, index) => (
                    <p key={`${detail}-${index}`} className="leading-7">
                      {detail}
                    </p>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    Chưa có mô tả bổ sung trong lang/wiki.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Thông số</CardTitle>
                <CardDescription>
                  Dữ liệu kỹ thuật dùng để tra cứu trong game.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4">
                  {record.attributes.map(([label, value]) => (
                    <div key={label} className="grid gap-1">
                      <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        {label}
                      </dt>
                      <dd className="text-sm leading-6 break-words">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {kind === "gu" ? (
          <TabsContent value="recipes" className="pt-5">
            {record.recipes?.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {record.recipes.map((recipe) => (
                  <Card key={recipe.id}>
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <FlaskConicalIcon className="size-5 text-primary" />
                        <Badge variant="secondary">Cổ phương</Badge>
                      </div>
                      <CardTitle className="font-serif">
                        {recipe.name}
                      </CardTitle>
                      <CardDescription>{recipe.summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol className="flex list-decimal flex-col gap-2 pl-5">
                        {recipe.ingredients.map((ingredient, index) => (
                          <li
                            key={`${ingredient}-${index}`}
                            className="pl-1 text-sm leading-6"
                          >
                            {ingredient}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FlaskConicalIcon />
                  </EmptyMedia>
                  <EmptyTitle>Chưa tìm thấy Cổ phương</EmptyTitle>
                  <EmptyDescription>
                    Lang của bản mod chưa có Cổ phương hoàn chỉnh liên kết trực
                    tiếp với con Cổ này.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </TabsContent>
        ) : null}

        {kind === "killer-moves" ? (
          <TabsContent value="formation" className="pt-5">
            {record.slots?.length ? (
              <KillerMoveFormation slots={record.slots} scrollId={record.id} />
            ) : (
              <Alert>
                <InfoIcon />
                <AlertTitle>Chưa có cấu hình ô</AlertTitle>
                <AlertDescription>
                  Sát chiêu này có trong catalog nhưng source chưa cung cấp đủ
                  vị trí 1–10.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        ) : null}

        {kind === "creatures" ? (
          <TabsContent value="spawns" className="pt-5">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">
                  Các quy tắc xuất hiện
                </CardTitle>
                <CardDescription>
                  Mỗi dòng là một biome modifier được mod đăng ký.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {record.details.map((detail, index) => (
                  <div
                    key={`${detail}-${index}`}
                    className="flex gap-3 rounded-lg border p-3 text-sm"
                  >
                    <MapPinnedIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{detail}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <Alert>
        <InfoIcon />
        <AlertTitle>Nguồn dữ liệu</AlertTitle>
        <AlertDescription>
          Thông tin được ghép từ lang, item model, texture và các bảng đã kiểm
          chứng trong minecraft-wiki.json. ID kỹ thuật được giữ nguyên để tiện
          dùng lệnh và đối chiếu source.
        </AlertDescription>
      </Alert>
    </main>
  )
}
