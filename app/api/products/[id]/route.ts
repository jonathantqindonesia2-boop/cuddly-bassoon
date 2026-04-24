import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, context: any) {
  const id = Number(context.params.id);
  const body = await req.json();
  const { name, category, costPrice, sellingPrice, stock } = body;

  if (!name || category == null || costPrice == null || sellingPrice == null || stock == null) {
    return NextResponse.json({ message: 'Semua field diperlukan.' }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
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

export async function DELETE(_req: Request, context: any) {
  const id = Number(context.params.id);
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
