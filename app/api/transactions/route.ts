import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CartItem {
  productId: number;
  quantity: number;
}

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items }: { items: CartItem[] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Keranjang kosong.' }, { status: 400 });
    }

    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    const lineItems = items.map((item) => {
      const product = products.find((product) => product.id === item.productId);
      if (!product) {
        throw new Error('Produk tidak ditemukan.');
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stok tidak cukup untuk ${product.name}.`);
      }
      return {
        productId: product.id,
        productName: product.name,
        quantity: Number(item.quantity),
        price: product.sellingPrice,
        profit: (product.sellingPrice - product.costPrice) * Number(item.quantity)
      };
    });

    const total = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const profit = lineItems.reduce((sum, item) => sum + item.profit, 0);

    const transaction = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          total,
          profit,
          items: { create: lineItems }
        },
        include: { items: true }
      }),
      ...lineItems.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      )
    ]);

    return NextResponse.json(transaction[0]);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message || 'Gagal membuat transaksi.' }, { status: 400 });
  }
}
