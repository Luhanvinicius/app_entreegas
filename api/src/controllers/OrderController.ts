import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export class OrderController {
  async create(req: AuthRequest, res: Response) {
    try {
      const customerId = req.user?.id;
      const { storeId, address, paymentType, items, totalAmount } = req.body;

      // items: { productId: string, quantity: number, price: number }[]

      if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

      const order = await prisma.order.create({
        data: {
          customerId,
          storeId,
          address,
          paymentType,
          totalAmount,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: { items: true }
      });

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

  // Courier route
  async availableOrders(req: Request, res: Response) {
    try {
      // Pedidos que estão em preparo ou aguardando entregador
      const ordersRaw = await prisma.order.findMany({
        where: { status: 'PREPARING', courierId: null },
        include: { store: { select: { name: true, address: true } }, customer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'asc' }
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
      const ordersRaw = await prisma.order.findMany({
        where: { courierId },
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

  // Accept order as courier
  async acceptOrder(req: AuthRequest, res: Response) {
    try {
      const courierId = req.user?.id;
      const id = req.params.id as string;

      if (!courierId) return res.status(401).json({ error: 'Unauthorized' });

      const order = await prisma.order.update({
        where: { id, courierId: null },
        data: { courierId, status: 'DISPATCHED' }
      });

      return res.json(order);
    } catch (error) {
      return res.status(400).json({ error: 'Order already accepted or invalid status' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      const currentOrder = await (prisma.order as any).findUnique({ where: { id } });
      if (!currentOrder) return res.status(404).json({ error: 'Order not found' });

      const newOrder = await prisma.order.update({
        where: { id },
        data: { status }
      });

      // Credit the courier if transitioned to DELIVERED
      if (currentOrder.status !== 'DELIVERED' && status === 'DELIVERED' && currentOrder.courierId) {
        await (prisma.user as any).update({
          where: { id: currentOrder.courierId },
          data: { balance: { increment: currentOrder.deliveryFee || 0 } }
        });
      }

      return res.json(newOrder);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
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
}
