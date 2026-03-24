import axios from 'axios';

interface Coordinates {
  lat: string;
  lon: string;
}

// Cache simples para evitar chamadas repetidas ao Nominatim (Geocoding)
const geoCache = new Map<string, Coordinates>();

export class DeliveryService {
  private static NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
  private static OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
  private static DEFAULT_CITY = 'Fortaleza, CE';

  /**
   * Converte endereço em coordenadas (Lat/Lon)
   */
  async getCoordinates(address: string): Promise<Coordinates> {
    const fullAddress = `${address}, ${DeliveryService.DEFAULT_CITY}`;
    
    if (geoCache.has(fullAddress)) {
      return geoCache.get(fullAddress)!;
    }

    try {
      const response = await axios.get(DeliveryService.NOMINATIM_URL, {
        params: {
          q: fullAddress,
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
        timeout: 5000,
        headers: { 'User-Agent': 'AppEntregasModernizado/1.0' }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error(`Endereço não encontrado em Fortaleza: ${address}`);
      }

      const coords = {
        lat: response.data[0].lat,
        lon: response.data[0].lon
      };

      geoCache.set(fullAddress, coords);
      return coords;
    } catch (error: any) {
      console.error('Erro no Nominatim:', error.message);
      throw new Error(error.message || 'Erro ao buscar coordenadas');
    }
  }

  /**
   * Calcula a distância real de rota entre dois pontos usando OSRM
   */
  async calculateDistance(pickup: Coordinates, delivery: Coordinates): Promise<number> {
    try {
      // OSRM usa o formato {lon},{lat};{lon},{lat}
      const url = `${DeliveryService.OSRM_URL}/${pickup.lon},${pickup.lat};${delivery.lon},${delivery.lat}?overview=false`;
      
      const response = await axios.get(url, { timeout: 5000 });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('Não foi possível traçar uma rota entre os pontos.');
      }

      // Distância vem em metros, convertemos para KM
      const distanceInMeters = response.data.routes[0].distance;
      const distanceInKm = distanceInMeters / 1000;

      return Number(distanceInKm.toFixed(2));
    } catch (error: any) {
      console.error('Erro no OSRM:', error.message);
      throw new Error('Falha ao calcular rota real.');
    }
  }

  /**
   * Função mestre para calcular a taxa final
   */
  async getDeliveryEstimate(pickupAddress: string, deliveryAddress: string, pricePerKm: number) {
    try {
      // 1. Pegar coordenadas de ambos os pontos
      const [pickupCoords, deliveryCoords] = await Promise.all([
        this.getCoordinates(pickupAddress),
        this.getCoordinates(deliveryAddress)
      ]);

      // 2. Calcular distância oficial de rota
      const distanceKm = await this.calculateDistance(pickupCoords, deliveryCoords);

      // 3. Calcular taxa final
      const deliveryFee = distanceKm * pricePerKm;

      return {
        distance_km: distanceKm,
        delivery_fee: Number(deliveryFee.toFixed(2)),
        pickup: pickupCoords,
        delivery: deliveryCoords
      };
    } catch (error: any) {
      throw error;
    }
  }
}
