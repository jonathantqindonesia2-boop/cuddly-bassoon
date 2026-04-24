import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { InventoryTable } from "@/components/inventory-table"

export const dynamic = "force-dynamic"

async function getProducts() {
  const supabase = await createClient()
  const { data } = await supabase.from("products").select("*").order("name")
  return data || []
}

export default async function InventoryPage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Stok Barang</h1>
            <p className="text-muted-foreground">
              Kelola inventaris dan stok produk toko Anda
            </p>
          </div>

          <InventoryTable products={products} />
        </div>
      </main>
    </div>
  )
}
