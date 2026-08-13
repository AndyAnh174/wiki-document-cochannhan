"use client"

import { useCallback, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google"
import {
  BookOpenIcon,
  BugIcon,
  DatabaseIcon,
  CircleHelpIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { CatalogManager } from "@/components/admin/catalog-manager"
import { FaqManager } from "@/components/admin/faq-manager"
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
import { FieldError } from "@/components/ui/field"
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

      const { data, error } = await client.rpc("is_admin")
      setAuthorized(data === true && !error)
      setChecking(false)
      if (data !== true || error)
        setAuthError("Tài khoản Google này không có quyền quản trị.")
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
          <TabsTrigger value="faq">
            <CircleHelpIcon data-icon="inline-start" /> FAQ
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
        <TabsContent value="faq" className="pt-6">
          <FaqManager />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function AdminLogin({ error }: { error: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(error)

  const signInWithGoogle = useCallback(async (credential?: string) => {
    const supabase = getBrowserSupabaseClient()
    if (!supabase || !credential) {
      setMessage("Google không trả về thông tin đăng nhập hợp lệ.")
      return
    }
    setSubmitting(true)
    setMessage("")
    await supabase.auth.signOut({ scope: "local" })
    const { error: loginError } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
    })
    setSubmitting(false)
    if (loginError)
      setMessage(`Không thể đăng nhập Google: ${loginError.message}`)
  }, [])

  const handleGoogleSuccess = useCallback(
    (response: CredentialResponse) => void signInWithGoogle(response.credential),
    [signInWithGoogle]
  )
  const handleGoogleError = useCallback(
    () => setMessage("Không thể mở hoặc hoàn tất đăng nhập Google."),
    []
  )

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Badge variant="outline" className="mb-2 w-fit">
            <ShieldCheckIcon data-icon="inline-start" /> Google OAuth · Supabase
          </Badge>
          <CardTitle className="font-serif text-2xl">
            Đăng nhập quản trị
          </CardTitle>
          <CardDescription>
            Chỉ tài khoản Google nằm trong danh sách quản trị mới có quyền ghi dữ liệu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wiki không nhận hay lưu mật khẩu Google. Supabase xử lý phiên đăng nhập và RLS kiểm tra quyền ở cơ sở dữ liệu.
          </p>
          {message ? <FieldError className="mt-4">{message}</FieldError> : null}
        </CardContent>
        <CardFooter className="justify-center">
          {submitting ? (
            <Button className="w-full" disabled>
              <Spinner data-icon="inline-start" /> Đang xác thực Google…
            </Button>
          ) : process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                shape="pill"
                size="large"
                theme="outline"
              />
            </GoogleOAuthProvider>
          ) : (
            <FieldError>Chưa cấu hình Google Client ID cho Wiki.</FieldError>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
