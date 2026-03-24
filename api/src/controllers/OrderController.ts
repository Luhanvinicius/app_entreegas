import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';
import { AsaasService } from '../services/AsaasService';

export class OrderController {
  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userStoreId = (req.user as any)?.storeId;

      const { 
        storeId: bodyStoreId, 
        address, 
        customerName, 
        customerPhone, 
        items, 
        totalAmount, 
        deliveryFee, 
        distance, 
        paymentMethod // ADVANCE ou ON_DELIVERY
      } = req.body;

      const finalStoreId = bodyStoreId || userStoreId;

      if (!finalStoreId) return res.status(400).json({ error: 'Store not found' });
      if (!userId && userRole === 'CUSTOMER') return res.status(401).json({ error: 'Unauthorized' });

      // @ts-ignore
      const order = await prisma.order.create({
        data: {
          storeId: finalStoreId as string,
          customerId: userRole === 'CUSTOMER' ? userId : null,
          address,
          customerName,
          customerPhone,
          totalAmount: Number(totalAmount),
          deliveryFee: Number(deliveryFee),
          distance: distance ? Number(distance) : null,
          paymentMethod: (paymentMethod || 'ADVANCE') as any,
          paymentStatus: paymentMethod === 'ADVANCE' ? 'PAID' : 'PENDING', // PEDIDO PAGO PELO CLIENTE
          status: paymentMethod === 'ADVANCE' ? 'PENDING' : 'AVAILABLE', // SÓ LIBERA SE PAGAR A TAXA
          items: {
            create: (items || []).map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: { items: true }
      });

      // Se o pedido já está pago pelo cliente (ADVANCE), o lojista paga a TAXA agora
      if (paymentMethod === 'ADVANCE') {
          try {
              const feeCharge = await AsaasService.createPixCharge(order.id, Number(deliveryFee));
              const finalizedOrder = await prisma.order.update({
                  where: { id: order.id },
                  data: {
                      asaasId: feeCharge.asaasId,
                      pixCode: feeCharge.pixCode,
                      pixQrCode: feeCharge.pixQrCode
                  }
              });
              return res.status(201).json(finalizedOrder);
          } catch (feeError) {
              console.error('Erro ao gerar tax do lojista:', feeError);
              return res.status(201).json(order); // Retorna o pedido mesmo com erro na taxa
          }
      }

      return res.status(201).json(order);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Admin route
  async indexAll(req: Request, res: Response) {
    try {
      const orders = await prisma.order.findMany({
        include: { customer: { select: { name: true, phone: true } }, courier: { select: { name: true, phone: true } }, store: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(orders);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Customer route
  async customerOrders(req: AuthRequest, res: Response) {
    try {
      const customerId = req.user?.id;
      const orders = await prisma.order.findMany({
        where: { customerId },
        include: { store: { select: { name: true } }, courier: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(orders);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async availableOrders(req: Request, res: Response) {
    try {
      // Pedidos que estão aguardando entregador
      const ordersRaw = await prisma.order.findMany({
        where: { status: 'AVAILABLE', courierId: null },
        include: { store: { select: { name: true, address: true } }, customer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
      });

      const orders = ordersRaw.map((o: any) => ({
        ...o,
        customer: {
          name: o.customerName || (o.customer ? o.customer.name : 'Avulso'),
          phone: o.customerPhone || (o.customer ? o.customer.phone : '')
        }
      }));

      return res.json(orders);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async courierDeliveries(req: AuthRequest, res: Response) {
    try {
      const courierId = req.user?.id;
      if (!courierId) return res.status(401).json({ error: 'Unauthorized' });

      console.log(`Buscando entregas para o entregador ID: ${courierId}`);
      
      const ordersRaw = await prisma.order.findMany({
        where: { 
          courierId,
          status: { not: 'DELIVERED' }
        },
        include: { store: true, customer: true },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`Encontradas ${ordersRaw.length} entregas ativas para o courier ${courierId}.`);
      ordersRaw.forEach(o => console.log(`- Pedido #${o.id.slice(0,8)} | Status: ${o.status}`));

      // Mapeamento compatível com o CourierDeliveriesScreen.tsx e AvailableOrdersScreen.tsx
      const orders = ordersRaw.map((o: any) => ({
        ...o,
        customerName: o.customerName || (o.customer ? o.customer.name : 'Avulso'),
        customerPhone: o.customerPhone || (o.customer ? o.customer.phone : ''),
        customer: {
          name: o.customerName || (o.customer ? o.customer.name : 'Avulso'),
          phone: o.customerPhone || (o.customer ? o.customer.phone : '')
        }
      }));

      return res.json(orders);
    } catch (error) {
      console.error('Erro em courierDeliveries:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Accept order as courier
  async acceptOrder(req: AuthRequest, res: Response) {
    try {
      const courierId = req.user?.id;
      const id = req.params.id as string;

      if (!courierId) return res.status(401).json({ error: 'Unauthorized' });

      console.log(`🤝 Entregador ID: ${courierId} está aceitando o pedido ID: ${id}`);
      const order = await prisma.order.update({
        where: { id },
        data: { courierId, status: 'ACCEPTED' }
      });
      console.log(`✅ Pedido ${id} aceito com sucesso pelo entregador ${courierId}`);

      return res.json(order);
    } catch (error) {
      return res.status(400).json({ error: 'Order already accepted or invalid status' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      const currentOrder = await prisma.order.findUnique({ where: { id } });
      if (!currentOrder) return res.status(404).json({ error: 'Order not found' });

      const newOrder = await prisma.order.update({
        where: { id },
        data: { status }
      });

      // Se for ENTREGUE e o pagamento estiver OK, credita o entregador
      if (status === 'DELIVERED' && currentOrder.courierId) {
         // Verifica se o pagamento foi concluído (pode ser manual pelo lojista ou via API Asaas futuramente)
         if (newOrder.paymentStatus === 'PAID') {
           await prisma.user.update({
             where: { id: currentOrder.courierId },
             data: { balance: { increment: currentOrder.deliveryFee || 0 } }
           });
         }
      }

      return res.json(newOrder);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markArrived(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      // @ts-ignore
      const order = await prisma.order.update({
        where: { id },
        data: { arrivedAt: new Date(), status: 'IN_TRANSIT' }
      });
      return res.json(order);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generatePixCharge(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      // @ts-ignore
      const order = await prisma.order.findUnique({ where: { id } });
      
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.paymentStatus === 'PAID') return res.status(400).json({ error: 'Order already paid' });
      if (order.paymentMethod !== 'ON_DELIVERY') return res.status(400).json({ error: 'This order is not for on-delivery payment' });

      if (order.asaasId && order.pixQrCode) {
        return res.json(order);
      }

      const charge = await AsaasService.createPixCharge(order.id, order.totalAmount);
      
      // @ts-ignore
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          asaasId: charge.asaasId,
          pixCode: charge.pixCode,
          pixQrCode: charge.pixQrCode
        }
      });

      return res.json(updatedOrder);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to generate pix' });
    }
  }

  async courierProfile(req: AuthRequest, res: Response) {
    try {
      const courierId = req.user?.id;
      if (!courierId) return res.status(401).json({ error: 'Unauthorized' });
      
      const user = await (prisma.user as any).findUnique({
        where: { id: courierId },
        select: { id: true, name: true, balance: true }
      });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async requestWithdrawal(req: AuthRequest, res: Response) {
    try {
      const courierId = req.user?.id;
      if (!courierId) return res.status(401).json({ error: 'Unauthorized' });

      const amount = Number(req.body.amount);
      if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

      const user = await (prisma.user as any).findUnique({ where: { id: courierId } });
      if (!user || user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

      const withdrawal = await (prisma as any).withdrawal.create({
        data: { courierId, amount, status: 'PENDING' }
      });

      await (prisma.user as any).update({
        where: { id: courierId },
        data: { balance: { decrement: amount } }
      });

      return res.json(withdrawal);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async checkPayment(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const order = await prisma.order.findUnique({ where: { id } });
      
      if (!order || !order.asaasId) return res.status(404).json({ error: 'Order/Payment not found' });
      
      const status = await AsaasService.getPaymentStatus(order.asaasId);
      console.log(`Verificando pagamento do pedido ${id}: Status atual no Asaas = ${status}`);
      
      if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status)) {
        const updatedOrder = await prisma.order.update({
          where: { id },
          data: { 
            status: 'AVAILABLE', 
            paymentStatus: 'PAID' 
          }
        });
        console.log(`✅ Pagamento confirmado para o pedido ${id}. Liberando entrega!`);
        return res.json({ paid: true, order: updatedOrder });
      }
      
      return res.json({ paid: false, status });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to check payment' });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const { event, payment } = req.body;
      console.log(`Webhook Asaas: Evento ${event} para pagamento ${payment.id}`);

      if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH'].includes(event)) {
        // Encontrar o pedido pelo asaasId
        const order = await prisma.order.findFirst({
          where: { asaasId: payment.id }
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'AVAILABLE', 
              paymentStatus: 'PAID'
            }
          });
          console.log(`Pedido ${order.id} liberado via Webhook!`);
        }
      }

      return res.status(200).send('OK');
    } catch (error) {
      console.error('Erro Webhook:', error);
      return res.status(500).send('Internal Server Error');
    }
  }
}
