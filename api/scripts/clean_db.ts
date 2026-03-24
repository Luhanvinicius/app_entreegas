import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧼 Iniciando limpeza do banco de dados...');

  // Deletar dependências primeiro
  await prisma.orderItem.deleteMany();
  await prisma.withdrawal.deleteMany();
  
  // Deletar pedidos
  const ordersDeleted = await prisma.order.deleteMany();
  console.log(`✅ ${ordersDeleted.count} pedidos removidos.`);

  // Zerar saldos dos usuários
  const usersUpdated = await prisma.user.updateMany({
    data: { balance: 0 }
  });
  console.log(`✅ ${usersUpdated.count} saldos zerados.`);

  console.log('✨ Banco de dados limpo com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
