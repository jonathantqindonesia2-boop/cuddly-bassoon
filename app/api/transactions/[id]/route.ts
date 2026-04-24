import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { id: Number(id) },
    include: { items: true }
  });

  if (!transaction) {
    return NextResponse.json({ message: 'Transaksi tidak ditemukan.' }, { status: 404 });
  }

  const actions = [
    ...transaction.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      })
    ),
    prisma.transactionItem.deleteMany({ where: { transactionId: Number(id) } }),
    prisma.transaction.delete({ where: { id: Number(id) } })
  ];

  await prisma.$transaction(actions);

  return NextResponse.json({ ok: true });
}
