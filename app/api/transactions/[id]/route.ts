import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: Request, context: any) {
  const id = Number(context.params.id);
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!transaction) {
    return NextResponse.json({ message: 'Transaksi tidak ditemukan.' }, { status: 404 });
  }

  const actions: Promise<any>[] = transaction.items.map((item) =>
    prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } }
    })
  );

  actions.push(prisma.transactionItem.deleteMany({ where: { transactionId: id } }));
  actions.push(prisma.transaction.delete({ where: { id } }));

  await prisma.$transaction(actions as any);

  return NextResponse.json({ ok: true });
}
