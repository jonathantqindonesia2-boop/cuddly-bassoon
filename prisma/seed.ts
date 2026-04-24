import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      { name: 'Minyak Goreng 1L', category: 'Minyak', costPrice: 12000, sellingPrice: 15000, stock: 25 },
      { name: 'Beras 5kg', category: 'Beras', costPrice: 65000, sellingPrice: 75000, stock: 12 },
      { name: 'Gula Pasir 1kg', category: 'Gula', costPrice: 14500, sellingPrice: 17000, stock: 18 },
      { name: 'Susu UHT', category: 'Susu', costPrice: 9000, sellingPrice: 12000, stock: 30 },
      { name: 'Kopi Sachet', category: 'Minuman', costPrice: 2500, sellingPrice: 3500, stock: 45 }
    ]
  });

  console.log('✅ Seed berhasil.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
