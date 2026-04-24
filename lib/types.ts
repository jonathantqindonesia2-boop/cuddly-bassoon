export interface Product {
  id: string
  name: string
  cost_price: number
  selling_price: number
  stock: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  total: number
  profit: number
  created_at: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  product_name: string
  quantity: number
  cost_price: number
  selling_price: number
  subtotal: number
  profit: number
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
  profit: number
}

export interface DailySummary {
  date: string
  total_transactions: number
  total_revenue: number
  total_profit: number
  items_sold: number
}
