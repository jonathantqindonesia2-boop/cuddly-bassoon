"use client"

import { useState, useMemo } from "react"
import { Product, CartItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface TransactionCartProps {
  products: Product[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TransactionCart({ products: initialProducts }: TransactionCartProps) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) && product.stock > 0
  )

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.subtotal,
        profit: acc.profit + item.profit,
        items: acc.items + item.quantity,
      }),
      { subtotal: 0, profit: 0, items: 0 }
    )
  }, [cart])

  const change = useMemo(() => {
    const payment = parseFloat(paymentAmount) || 0
    return payment - cartTotal.subtotal
  }, [paymentAmount, cartTotal.subtotal])

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id)
    const currentQty = existingItem?.quantity || 0

    if (currentQty >= product.stock) return

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * product.selling_price,
                profit: (item.quantity + 1) * (product.selling_price - product.cost_price),
              }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          subtotal: product.selling_price,
          profit: product.selling_price - product.cost_price,
        },
      ])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.product.id === productId)
    if (!item) return

    const newQty = item.quantity + delta
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId))
    } else if (newQty <= item.product.stock) {
      setCart(
        cart.map((i) =>
          i.product.id === productId
            ? {
                ...i,
                quantity: newQty,
                subtotal: newQty * i.product.selling_price,
                profit: newQty * (i.product.selling_price - i.product.cost_price),
              }
            : i
        )
      )
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setPaymentAmount("")
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setIsLoading(true)

    const supabase = createClient()

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        total: cartTotal.subtotal,
        profit: cartTotal.profit,
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      setIsLoading(false)
      return
    }

    // Create transaction items
    const transactionItems = cart.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      cost_price: item.product.cost_price,
      selling_price: item.product.selling_price,
      subtotal: item.subtotal,
      profit: item.profit,
    }))

    const { error: itemsError } = await supabase
      .from("transaction_items")
      .insert(transactionItems)

    if (itemsError) {
      setIsLoading(false)
      return
    }

    // Update product stock
    for (const item of cart) {
      await supabase
        .from("products")
        .update({ stock: item.product.stock - item.quantity })
        .eq("id", item.product.id)
    }

    // Refresh products
    const { data: updatedProducts } = await supabase
      .from("products")
      .select("*")
      .order("name")

    if (updatedProducts) {
      setProducts(updatedProducts)
    }

    setIsLoading(false)
    setIsCheckoutOpen(false)
    setIsSuccessOpen(true)
    clearCart()
    router.refresh()
  }

  const getAvailableStock = (product: Product) => {
    const cartItem = cart.find((item) => item.product.id === product.id)
    return product.stock - (cartItem?.quantity || 0)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Product List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {searchQuery ? "Produk tidak ditemukan" : "Tidak ada produk tersedia"}
            </div>
          ) : (
            filteredProducts.map((product) => {
              const availableStock = getAvailableStock(product)
              const inCart = cart.find((item) => item.product.id === product.id)
              return (
                <Card
                  key={product.id}
                  className="cursor-pointer transition-all hover:shadow-md border-border/50"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{product.name}</h3>
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatCurrency(product.selling_price)}
                        </p>
                      </div>
                      {inCart && (
                        <Badge variant="secondary" className="shrink-0">
                          {inCart.quantity}x
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        Stok: {availableStock}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={availableStock === 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                Keranjang
              </CardTitle>
              {cart.length > 0 && (
                <Badge variant="secondary">{cartTotal.items} item</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">Keranjang kosong</p>
                <p className="text-xs">Pilih produk untuk ditambahkan</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.product.selling_price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-semibold text-sm">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="flex-col gap-4 pt-4">
              <Separator />
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cartTotal.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Keuntungan</span>
                  <span className="text-primary">{formatCurrency(cartTotal.profit)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal.subtotal)}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={clearCart} className="flex-1">
                  Batal
                </Button>
                <Button onClick={() => setIsCheckoutOpen(true)} className="flex-1">
                  Bayar
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Bayar</span>
                <span>{formatCurrency(cartTotal.subtotal)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah Uang (Rp)</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Masukkan jumlah uang"
                className="text-lg"
              />
            </div>
            {paymentAmount && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 ${
                  change >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                }`}
              >
                {change >= 0 ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {change >= 0 ? `Kembalian: ${formatCurrency(change)}` : "Uang kurang"}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isLoading || change < 0 || !paymentAmount}
            >
              {isLoading ? "Memproses..." : "Selesaikan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaksi Berhasil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-center">
              Transaksi telah berhasil disimpan.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSuccessOpen(false)} className="w-full">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
