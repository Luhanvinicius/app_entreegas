import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class StoreController {
  async create(req: Request, res: Response) {
    try {
      const { name, description, phone, address, ownerEmail, ownerPassword } = req.body;
      
      const store = await prisma.store.create({
        data: { name, description, phone, address }
      });

      if (ownerEmail && ownerPassword) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);
        await prisma.user.create({
          data: {
            name: `Dono de ${name}`,
            email: ownerEmail,
            password: hashedPassword,
            phone,
            role: 'SHOPKEEPER',
            storeId: store.id,
            isApproved: true,
          }
        });
      }

      return res.status(201).json(store);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, description, phone, address } = req.body;

      const store = await prisma.store.update({
        where: { id },
        data: { name, description, phone, address }
      });
      return res.json(store);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      // In a real app we might want to check for existing orders before deleting
      await prisma.store.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async index(req: Request, res: Response) {
    try {
      const stores = await prisma.store.findMany({
        where: { isActive: true }
      });
      return res.json(stores);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async indexAll(req: Request, res: Response) {
    // Admin route
    try {
      const stores = await prisma.store.findMany();
      return res.json(stores);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async toggleActive(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const store = await prisma.store.update({
        where: { id },
        data: { isActive }
      });
      return res.json(store);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
