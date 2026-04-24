import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, category, costPrice, sellingPrice, stock } = body;

  if (!name || category == null || costPrice == null || sellingPrice == null || stock == null) {
    return NextResponse.json({ message: 'Semua field diperlukan.' }, { status: 400 });
  }

  if (Number(costPrice) < 0 || Number(sellingPrice) < 0 || Number(stock) < 0) {
    return NextResponse.json({ message: 'Harga dan stok tidak boleh negatif.' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: String(name).trim(),
      category: String(category).trim(),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock)
    }
  });

  return NextResponse.json(product);
}
