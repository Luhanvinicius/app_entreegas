import { Request, Response } from 'express';
import { DeliveryService } from '../services/DeliveryService';

export class DeliveryController {
  private service: DeliveryService;

  constructor() {
    this.service = new DeliveryService();
  }

  calculate = async (req: Request, res: Response) => {
    try {
      const { pickup_address, delivery_address, price_per_km = 2.5 } = req.body;

      if (!pickup_address || !delivery_address) {
        return res.status(400).json({ error: 'Os endereços de coleta e entrega são obrigatórios.' });
      }

      const estimate = await this.service.getDeliveryEstimate(
        pickup_address,
        delivery_address,
        Number(price_per_km)
      );

      return res.json({
        distance_km: estimate.distance_km,
        delivery_fee: estimate.delivery_fee,
        pickup: estimate.pickup,
        delivery: estimate.delivery,
        city: 'Fortaleza, CE'
      });
    } catch (error: any) {
      console.error('Erro ao calcular taxa:', error.message);
      return res.status(404).json({ error: error.message || 'Erro inesperado no cálculo de taxa.' });
    }
  };
}
