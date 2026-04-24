import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end
      }
    },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });

  const summary = {
    totalSales: transactions.reduce((sum, tx) => sum + tx.total, 0),
    totalProfit: transactions.reduce((sum, tx) => sum + tx.profit, 0),
    count: transactions.length
  };

  return NextResponse.json({ summary, transactions });
}
