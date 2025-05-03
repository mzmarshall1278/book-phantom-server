// src/paypal/paypal.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {core, orders} from '@paypal/checkout-server-sdk';

@Injectable()
export class PayPalService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly environment: core.PayPalEnvironment;
  private readonly client: core.PayPalHttpClient;
  private readonly logger = new Logger(PayPalService.name);

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET')!;
    const environment = this.configService.get<'sandbox' | 'live'>('PAYPAL_ENVIRONMENT') || 'sandbox';

    if (environment === 'sandbox') {
      this.environment = new core.SandboxEnvironment(this.clientId, this.clientSecret);
    } else {
      this.environment = new core.LiveEnvironment(this.clientId, this.clientSecret);
    }

    this.client = new core.PayPalHttpClient(this.environment);
    this.logger.log(`PayPal Environment: ${environment}`);
  }

  async createOrder(bookTitle: string, amount: number, returnUrl: string, cancelUrl: string): Promise<string | null> {
    const request = new orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD', // Adjust currency as needed
            value: amount.toFixed(2),
          },
          description: bookTitle,
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    });

    try {
      const response = await this.client.execute(request);
      if (response.statusCode === 201) {
        const approvalLink = response.result.links.find((link) => link.rel === 'approve');
        return approvalLink?.href || null;
      }
      this.logger.error('PayPal Order Creation Failed:', response);
      return null;
    } catch (error) {
      this.logger.error('Error creating PayPal order:', error);
      return null;
    }
  }

  async captureOrder(orderId: string): Promise<any | null> {
    const request = new orders.OrdersCaptureRequest(orderId);
    (request as any).requestBody({}); // Cast request to 'any' before accessing requestBody

    try {
      const response = await this.client.execute(request);
      if (response.statusCode === 201 || response.statusCode === 200) {
        this.logger.log(`PayPal Order Captured. Status: ${response.result.status}`);
        return response.result;
      }
      this.logger.error(`PayPal Order Capture Failed for Order ID ${orderId}:`, response);
      return null;
    } catch (error) {
      this.logger.error(`Error capturing PayPal order ${orderId}:`, error);
      return null;
    }
  }
}