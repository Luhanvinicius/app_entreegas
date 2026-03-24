import axios from 'axios';

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjYyY2IzM2YyLTQ5MTQtNGQ5OS04NzAzLTNiMTU4OGVjODBmODo6JGFhY2hfYzFlNTQ3OGYtYzQ0MS00NjY4LWJiMjEtZDlhMjcwMTcwNDdk';
const ASAAS_CUSTOMER_ID = 'cus_000007361599';
const ASAAS_URL = 'https://sandbox.asaas.com/api/v3';

const asaasApi = axios.create({
  baseURL: ASAAS_URL,
  headers: {
    access_token: ASAAS_API_KEY,
    'Content-Type': 'application/json',
  },
});

export class AsaasService {
  static async createPixCharge(orderId: string, amount: number) {
    try {
      // 1. Criar a cobrança
      const paymentResponse = await asaasApi.post('/payments', {
        customer: ASAAS_CUSTOMER_ID,
        billingType: 'PIX',
        value: amount,
        dueDate: new Date().toISOString().split('T')[0], // Hoje
        externalReference: orderId,
        description: `Pagamento Pedido ${orderId.substring(0, 8)}`,
      });

      const paymentId = paymentResponse.data.id;

      // 2. Buscar o código PIX e QR Code
      const pixResponse = await asaasApi.get(`/payments/${paymentId}/pixQrCode`);

      return {
        asaasId: paymentId,
        pixCode: pixResponse.data.payload,
        pixQrCode: pixResponse.data.encodedImage,
      };
    } catch (error: any) {
      console.error('Erro Asaas API:', error.response?.data || error.message);
      throw new Error('Falha ao gerar cobrança PIX no Asaas');
    }
  }

  static async getPaymentStatus(id: string) {
    const response = await asaasApi.get(`/payments/${id}`);
    return response.data.status; 
  }
}
