"use client"

import { useState, Fragment } from "react"
import { Transaction, TransactionItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  ShoppingCart,
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DailyReportProps {
  initialTransactions: (Transaction & { items: TransactionItem[] })[]
  initialDate: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const hours = date.getUTCHours().toString().padStart(2, "0")
  const minutes = date.getUTCMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

export function DailyReport({ initialTransactions, initialDate }: DailyReportProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<
    (Transaction & { items: TransactionItem[] }) | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<
    (Transaction & { items: TransactionItem[] }) | null
  >(null)
  const [editedItems, setEditedItems] = useState<TransactionItem[]>([])
  const [isEditing, setIsEditing] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  const summary = transactions.reduce(
    (acc, t) => ({
      totalRevenue: acc.totalRevenue + t.total,
      totalProfit: acc.totalProfit + t.profit,
      totalItems: acc.totalItems + t.items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { totalRevenue: 0, totalProfit: 0, totalItems: 0 }
  )

  const fetchTransactions = async (date: string) => {
    setIsLoading(true)
    const supabase = createClient()

    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data } = await supabase
      .from("transactions")
      .select(
        `
        *,
        items:transaction_items(*)
      `
      )
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: false })

    if (data) {
      setTransactions(data as (Transaction & { items: TransactionItem[] })[])
    }
    setSelectedDate(date)
    setIsLoading(false)
  }

  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate)
    if (direction === "prev") {
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    const newDate = currentDate.toISOString().split("T")[0]
    if (newDate <= today) {
      fetchTransactions(newDate)
    }
  }

  // Delete transaction handler
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // First, restore stock for all items in the transaction
      for (const item of transactionToDelete.items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single()

        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock + item.quantity })
            .eq("id", item.product_id)
        }
      }

      // Delete transaction (cascade will delete transaction_items)
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionToDelete.id)

      if (error) throw error

      // Update local state
      setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id))
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
    } catch (error) {
      console.error("Error deleting transaction:", error)
      alert("Gagal menghapus transaksi")
    } finally {
      setIsDeleting(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (transaction: Transaction & { items: TransactionItem[] }) => {
    setTransactionToEdit(transaction)
    setEditedItems(transaction.items.map((item) => ({ ...item })))
    setEditDialogOpen(true)
  }

  // Update item quantity in edit mode
  const updateEditedItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setEditedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const subtotal = newQuantity * item.selling_price
          const profit = newQuantity * (item.selling_price - item.cost_price)
          return { ...item, quantity: newQuantity, subtotal, profit }
        }
        return item
      })
    )
  }

  // Remove item from edit
  const removeEditedItem = (itemId: string) => {
    setEditedItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  // Save edited transaction
  const handleSaveEdit = async () => {
    if (!transactionToEdit || editedItems.length === 0) return

    setIsEditing(true)
    const supabase = createClient()

    try {
      // Calculate new totals
      const newTotal = editedItems.reduce((sum, item) => sum + item.subtotal, 0)
      const newProfit = editedItems.reduce((sum, item) => sum + item.profit, 0)

      // Find items to delete (items in original but not in edited)
      const deletedItems = transactionToEdit.items.filter(
        (original) => !editedItems.find((edited) => edited.id === original.id)
      )

      // Find items with changed quantities
      const changedItems = editedItems.filter((edited) => {
        const original = transactionToEdit.items.find((o) => o.id === edited.id)
        return original && original.quantity !== edited.quantity
      })

      // Restore stock for deleted items
      for (const item of deletedItems) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single()

        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock + item.quantity })
            .eq("id", item.product_id)
        }

        // Delete the transaction item
        await supabase.from("transaction_items").delete().eq("id", item.id)
      }

      // Adjust stock for changed items
      for (const edited of changedItems) {
        const original = transactionToEdit.items.find((o) => o.id === edited.id)
        if (!original) continue

        const quantityDiff = original.quantity - edited.quantity

        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", edited.product_id)
          .single()

        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock + quantityDiff })
            .eq("id", edited.product_id)
        }

        // Update the transaction item
        await supabase
          .from("transaction_items")
          .update({
            quantity: edited.quantity,
            subtotal: edited.subtotal,
            profit: edited.profit,
          })
          .eq("id", edited.id)
      }

      // Update transaction totals
      await supabase
        .from("transactions")
        .update({ total: newTotal, profit: newProfit })
        .eq("id", transactionToEdit.id)

      // Update local state
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === transactionToEdit.id) {
            return {
              ...t,
              total: newTotal,
              profit: newProfit,
              items: editedItems,
            }
          }
          return t
        })
      )

      setEditDialogOpen(false)
      setTransactionToEdit(null)
      setEditedItems([])
    } catch (error) {
      console.error("Error updating transaction:", error)
      alert("Gagal mengupdate transaksi")
    } finally {
      setIsEditing(false)
    }
  }

  // Generate last 30 days for dropdown
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split("T")[0]
  })

  // Calculate edited totals
  const editedTotal = editedItems.reduce((sum, item) => sum + item.subtotal, 0)
  const editedProfit = editedItems.reduce((sum, item) => sum + item.profit, 0)

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("prev")}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedDate} onValueChange={fetchTransactions}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((date) => (
                <SelectItem key={date} value={date}>
                  {formatDate(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("next")}
            disabled={isLoading || selectedDate === today}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {selectedDate !== today && (
          <Button variant="outline" onClick={() => fetchTransactions(today)}>
            Hari Ini
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transaksi
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">{summary.totalItems} item terjual</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
            <Wallet className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">penjualan kotor</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Keuntungan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(summary.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">laba bersih</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada transaksi pada tanggal ini</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Item</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Keuntungan</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <Fragment key={transaction.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setExpandedTransaction(
                            expandedTransaction === transaction.id ? null : transaction.id
                          )
                        }
                      >
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{formatTime(transaction.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.total)}
                        </TableCell>
                        <TableCell className="text-right text-primary">
                          {formatCurrency(transaction.profit)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditDialog(transaction)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setTransactionToDelete(transaction)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedTransaction === transaction.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium mb-2">Detail Item:</p>
                              {transaction.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-sm bg-background rounded-lg p-2"
                                >
                                  <span>
                                    {item.product_name} x {item.quantity}
                                  </span>
                                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Hapus Transaksi
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Stok produk akan dikembalikan secara
              otomatis. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {transactionToDelete && (
            <div className="py-4 space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Detail Transaksi:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Waktu: {formatTime(transactionToDelete.created_at)}</p>
                  <p>Total: {formatCurrency(transactionToDelete.total)}</p>
                  <p>Item: {transactionToDelete.items.length} produk</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
            <DialogDescription>
              Ubah jumlah item atau hapus item dari transaksi. Stok akan disesuaikan secara otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto">
            {editedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Tidak ada item dalam transaksi</p>
                <p className="text-sm">Hapus transaksi jika tidak ada item</p>
              </div>
            ) : (
              editedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      @ {formatCurrency(item.selling_price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`qty-${item.id}`} className="sr-only">
                      Jumlah
                    </Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateEditedItemQuantity(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-20 text-center"
                    />
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeEditedItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          {editedItems.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatCurrency(editedTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Keuntungan</span>
                <span className="font-bold text-primary">{formatCurrency(editedProfit)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditing || editedItems.length === 0}>
              {isEditing ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
