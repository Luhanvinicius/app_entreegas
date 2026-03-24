import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log('🧼 Iniciando limpeza do banco de dados...');
  
  // 1. Apagar todos os pedidos
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✅ ${deletedOrders.count} pedidos removidos.`);

  // 2. Zerar saldos dos usuários
  const updatedUsers = await prisma.user.updateMany({
    data: { balance: 0 }
  });
  console.log(`✅ ${updatedUsers.count} usuários tiveram o saldo zerado.`);

  console.log('✨ Banco de dados pronto para novos testes!');
}

clean()
  .catch(e => console.error('❌ Erro na limpeza:', e))
  .finally(async () => await prisma.$disconnect());
