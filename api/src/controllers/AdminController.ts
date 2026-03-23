import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class AdminController {
  async listCouriers(req: Request, res: Response) {
    try {
      const couriers = await prisma.user.findMany({
        where: { role: 'COURIER' },
        select: { id: true, name: true, email: true, phone: true, isApproved: true, isActive: true, createdAt: true }
      });
      return res.json(couriers);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateCourier(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, phone, email, isApproved, isActive } = req.body;

      const courier = await prisma.user.update({
        where: { id, role: 'COURIER' },
        data: { 
          name, phone, email,
          ...(isApproved !== undefined && { isApproved }),
          ...(isActive !== undefined && { isActive }),
        }
      });

      return res.json(courier);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteCourier(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await prisma.user.delete({ where: { id, role: 'COURIER' } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDashboardStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalOrders, todayOrders, deliveriesRealizadas, activeStores] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: { createdAt: { gte: today } }
        }),
        prisma.order.count({
          where: { status: 'DELIVERED' }
        }),
        prisma.store.count({
          where: { isActive: true }
        })
      ]);

      return res.json({
        totalOrders,
        todayOrders,
        deliveriesRealizadas,
        activeStores
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
