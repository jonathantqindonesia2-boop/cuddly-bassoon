import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardStats } from "@/components/dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, Package, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

async function getDashboardData() {
  const supabase = await createClient()

  // Get all products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name")

  // Get today's transactions
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const { data: todayTransactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select(`
      *,
      items:transaction_items(*)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  const totalProducts = products?.length || 0
  const lowStockCount = products?.filter((p) => p.stock <= 10).length || 0
  const todayRevenue = todayTransactions?.reduce((sum, t) => sum + t.total, 0) || 0
  const todayProfit = todayTransactions?.reduce((sum, t) => sum + t.profit, 0) || 0
  const todayTransactionCount = todayTransactions?.length || 0

  return {
    totalProducts,
    lowStockCount,
    todayRevenue,
    todayProfit,
    todayTransactionCount,
    lowStockProducts: products?.filter((p) => p.stock <= 10).slice(0, 5) || [],
    recentTransactions: recentTransactions || [],
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang di sistem manajemen Toko Kelontong
            </p>
          </div>

          <DashboardStats
            totalProducts={data.totalProducts}
            lowStockCount={data.lowStockCount}
            todayRevenue={data.todayRevenue}
            todayProfit={data.todayProfit}
            todayTransactions={data.todayTransactionCount}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Low Stock Alert */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-amber-500" />
                  Stok Menipis
                </CardTitle>
                <Link
                  href="/inventory"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Lihat Semua <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent>
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Semua stok dalam kondisi baik
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                      >
                        <span className="font-medium text-sm">{product.name}</span>
                        <Badge
                          variant={product.stock === 0 ? "destructive" : "secondary"}
                          className={
                            product.stock === 0
                              ? ""
                              : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          }
                        >
                          {product.stock === 0 ? "Habis" : `${product.stock} tersisa`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Transaksi Terbaru
                </CardTitle>
                <Link
                  href="/reports"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Lihat Laporan <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent>
                {data.recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Belum ada transaksi
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {transaction.items?.length || 0} item
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(transaction.total)}
                          </p>
                          <p className="text-xs text-primary">
                            +{formatCurrency(transaction.profit)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
