import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { TransactionCart } from "@/components/transaction-cart"

export const dynamic = "force-dynamic"

async function getProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*")
    .gt("stock", 0)
    .order("name")
  return data || []
}

export default async function TransactionPage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Transaksi</h1>
            <p className="text-muted-foreground">
              Catat penjualan dan kelola transaksi
            </p>
          </div>

          <TransactionCart products={products} />
        </div>
      </main>
    </div>
  )
}
