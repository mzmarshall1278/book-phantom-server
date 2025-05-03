import { Module } from '@nestjs/common';
import { PayPalService } from './paypal.service';
import { PaypalController } from './paypal.controller';

@Module({
  controllers: [PaypalController],
  providers: [PayPalService],
  exports: [PayPalService]
})
export class PaypalModule {}
