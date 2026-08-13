"use client"

import { useEffect, useState, type FormEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import {
  BookOpenIcon,
  BugIcon,
  DatabaseIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { CatalogManager } from "@/components/admin/catalog-manager"
import { RecipeManager } from "@/components/admin/recipe-manager"
import { WikiManager } from "@/components/admin/wiki-manager"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import {
  getBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
} from "@/lib/supabase/client"

export function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [authError, setAuthError] = useState("")

  useEffect(() => {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    const client = supabase

    async function verify(nextSession: Session | null) {
      setSession(nextSession)
      if (!nextSession) {
        setAuthorized(false)
        setChecking(false)
        return
      }

      const { data, error } = await client
        .from("admin_users")
        .select("user_id")
        .eq("user_id", nextSession.user.id)
        .maybeSingle()
      setAuthorized(Boolean(data) && !error)
      setChecking(false)
      if (!data || error) setAuthError("Tài khoản này không có quyền quản trị.")
    }

    void client.auth.getSession().then(({ data }) => verify(data.session))
    const { data: listener } = client.auth.onAuthStateChange(
      (_event, nextSession) => void verify(nextSession)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!isBrowserSupabaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Alert variant="destructive">
          <DatabaseIcon />
          <AlertTitle>Chưa cấu hình Supabase cho trình duyệt</AlertTitle>
          <AlertDescription>
            Cần đặt NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
            trong môi trường build.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  if (checking) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner /> Đang kiểm tra phiên quản trị…
        </div>
      </main>
    )
  }

  if (!session || !authorized) {
    return <AdminLogin error={authError} />
  }

  async function signOut() {
    await getBrowserSupabaseClient()?.auth.signOut()
    toast.add({ type: "success", title: "Đã đăng xuất" })
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Badge variant="outline" className="mb-4">
            <ShieldCheckIcon data-icon="inline-start" /> Khu vực bảo vệ bằng RLS
          </Badge>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
            Quản trị Wiki
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Quản lý dữ liệu công khai của Cổ Chân Nhân Wiki. Mọi thay đổi được
            ghi trực tiếp vào Supabase.
          </p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOutIcon data-icon="inline-start" /> Đăng xuất
        </Button>
      </header>

      <Tabs defaultValue="catalog">
        <TabsList variant="line">
          <TabsTrigger value="catalog">
            <BugIcon data-icon="inline-start" /> Nội dung
          </TabsTrigger>
          <TabsTrigger value="recipes">
            <DatabaseIcon data-icon="inline-start" /> Cổ phương
          </TabsTrigger>
          <TabsTrigger value="wiki">
            <BookOpenIcon data-icon="inline-start" /> Chương Wiki
          </TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="pt-6">
          <CatalogManager />
        </TabsContent>
        <TabsContent value="recipes" className="pt-6">
          <RecipeManager />
        </TabsContent>
        <TabsContent value="wiki" className="pt-6">
          <WikiManager />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function AdminLogin({ error }: { error: string }) {
  const [email, setEmail] = useState("admin@ccn.local")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(error)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    setSubmitting(true)
    setMessage("")
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setSubmitting(false)
    if (loginError) setMessage("Email hoặc mật khẩu không đúng.")
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Badge variant="outline" className="mb-2 w-fit">
            <ShieldCheckIcon data-icon="inline-start" /> Supabase Auth
          </Badge>
          <CardTitle className="font-serif text-2xl">
            Đăng nhập quản trị
          </CardTitle>
          <CardDescription>
            Chỉ tài khoản nằm trong danh sách quản trị mới có quyền ghi dữ liệu.
          </CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(message) || undefined}>
                <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(message)}
                  required
                />
              </Field>
              <Field data-invalid={Boolean(message) || undefined}>
                <FieldLabel htmlFor="admin-password">Mật khẩu</FieldLabel>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(message)}
                  required
                />
                <FieldDescription>
                  Mật khẩu quản trị Wiki, không phải mật khẩu Supabase Studio.
                </FieldDescription>
                {message ? <FieldError>{message}</FieldError> : null}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-6">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Spinner data-icon="inline-start" /> : null}
              Đăng nhập
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
