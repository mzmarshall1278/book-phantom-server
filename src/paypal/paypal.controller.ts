import { Controller } from '@nestjs/common';
import { PayPalService } from './paypal.service';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PayPalService) {}
}
