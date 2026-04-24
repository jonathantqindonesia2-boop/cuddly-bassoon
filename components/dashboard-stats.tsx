"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, TrendingUp, Wallet } from "lucide-react"

interface DashboardStatsProps {
  totalProducts: number
  lowStockCount: number
  todayRevenue: number
  todayProfit: number
  todayTransactions: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function DashboardStats({
  totalProducts,
  lowStockCount,
  todayRevenue,
  todayProfit,
  todayTransactions,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "Total Produk",
      value: totalProducts.toString(),
      subtitle: `${lowStockCount} stok menipis`,
      icon: Package,
      iconColor: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Transaksi Hari Ini",
      value: todayTransactions.toString(),
      subtitle: "transaksi",
      icon: ShoppingCart,
      iconColor: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Pendapatan Hari Ini",
      value: formatCurrency(todayRevenue),
      subtitle: "total penjualan",
      icon: Wallet,
      iconColor: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Keuntungan Hari Ini",
      value: formatCurrency(todayProfit),
      subtitle: "laba bersih",
      icon: TrendingUp,
      iconColor: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={cn(stat.bgColor, "rounded-lg p-2")}>
              <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
