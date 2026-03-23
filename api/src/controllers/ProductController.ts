import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class ProductController {
  async create(req: Request, res: Response) {
    try {
      const { name, description, price, imageUrl, storeId } = req.body;
      const product = await prisma.product.create({
        data: { name, description, price, imageUrl, storeId }
      });
      return res.status(201).json(product);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async indexByStore(req: Request, res: Response) {
    try {
      const { storeId } = req.params;
      const products = await prisma.product.findMany({
        where: { storeId, isAvailable: true }
      });
      return res.json(products);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async toggleAvailable(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: { isAvailable }
      });
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
