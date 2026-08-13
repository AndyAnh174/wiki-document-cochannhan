import type { Metadata } from "next"

import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Quản trị Wiki",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminDashboard />
}
