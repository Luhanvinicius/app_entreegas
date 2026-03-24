import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export class ShopkeeperController {
  async dashboardStats(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId;
      if (!storeId) return res.status(403).json({ error: 'Shopkeeper does not have a valid store' });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalOrders, todayOrders, productsCount] = await Promise.all([
        prisma.order.count({ where: { storeId } }),
        prisma.order.count({ where: { storeId, createdAt: { gte: today } } }),
        prisma.product.count({ where: { storeId } })
      ]);

      return res.json({ totalOrders, todayOrders, productsCount });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOrders(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId;
      if (!storeId) return res.status(403).json({ error: 'Invalid store' });

      const ordersRaw = await prisma.order.findMany({
        where: { storeId },
        include: { customer: { select: { name: true, phone: true } }, courier: { select: { name: true, phone: true } }, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      });

      const orders = ordersRaw.map(o => ({
        ...o,
        customer: {
          name: (o as any).customerName || (o.customer ? (o as any).customer.name : 'Avulso'),
          phone: (o as any).customerPhone || (o.customer ? (o as any).customer.phone : '')
        }
      }));

      return res.json(orders);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createOrder(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId;
      if (!storeId) return res.status(403).json({ error: 'Invalid store' });

      const { customerName, customerPhone, address, deliveryAddress, totalAmount, deliveryFee, paymentType, distance } = req.body;

      const finalAddress = address || deliveryAddress;

      const order = await (prisma.order as any).create({
        data: {
          storeId,
          customerName,
          customerPhone,
          address: finalAddress,
          totalAmount: Number(totalAmount.toString().replace(',', '.')),
          deliveryFee: Number((deliveryFee || 0).toString().replace(',', '.')),
          paymentType: paymentType || 'PIX',
          status: 'PREPARING',
          distance: distance ? Number(distance) : null
        }
      });

      return res.status(201).json(order);
    } catch (error) {
      console.error("ERRO AO CRIAR ENTREGA:", error);
      return res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
  }

  async createProduct(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId;
      if (!storeId) return res.status(403).json({ error: 'Invalid store' });

      const { name, description, price, imageUrl } = req.body;
      const product = await prisma.product.create({
        data: { name, description, price: Number(price), imageUrl, storeId }
      });
      return res.status(201).json(product);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProducts(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId;
      if (!storeId) return res.status(403).json({ error: 'Invalid store' });

      const products = await prisma.product.findMany({
        where: { storeId },
        orderBy: { name: 'asc' }
      });
      return res.json(products);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateOrderStatus(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId;
      const id = req.params.id as string;
      const { status } = req.body;

      if (!storeId) return res.status(403).json({ error: 'Invalid store' });

      const currentOrder = await (prisma.order as any).findUnique({ where: { id } });
      if (!currentOrder || currentOrder.storeId !== storeId) return res.status(404).json({ error: 'Order not found' });

      const order = await prisma.order.update({
        where: { id },
        data: { status }
      });

      if (currentOrder.status !== 'DELIVERED' && status === 'DELIVERED' && currentOrder.courierId) {
        await (prisma.user as any).update({
          where: { id: currentOrder.courierId },
          data: { balance: { increment: currentOrder.deliveryFee || 0 } }
        });
      }

      return res.json(order);
    } catch (error) {
      return res.status(400).json({ error: 'Order not found or invalid access' });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId as string;
      if (!storeId) return res.status(403).json({ error: 'Invalid store' });

      const store = await prisma.store.findUnique({ where: { id: storeId } });
      return res.json(store);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const storeId = req.user?.storeId as string;
      if (!storeId) return res.status(403).json({ error: 'Invalid store' });

      const { name, address, phone } = req.body;
      const store = await prisma.store.update({
        where: { id: storeId },
        data: { name, address, phone }
      });
      return res.json(store);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
