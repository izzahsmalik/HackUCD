import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { isProduction } from './payments.constants.js';
import { PaymentsService } from './payments.service.js';
import type { CheckoutSessionDto, DevCompleteDto } from './dto/payments.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('status')
  async getStatus(): Promise<{ isPremium: boolean }> {
    return { isPremium: await this.paymentsService.getIsPremium() };
  }

  @Post('checkout-session')
  createCheckoutSession(@Body() dto?: CheckoutSessionDto) {
    validateUrl(dto?.successUrl, 'successUrl');
    validateUrl(dto?.cancelUrl, 'cancelUrl');
    return this.paymentsService.createCheckoutSession(dto);
  }

  /** Stripe posts raw JSON here; the signature is computed over those exact bytes. */
  @Post('webhook')
  @HttpCode(200) // webhooks answer 200, not Nest's default 201
  handleWebhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody || req.rawBody.length === 0) {
      throw new BadRequestException('raw body unavailable');
    }
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      throw new BadRequestException('stripe-signature header is required');
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  /** Local/demo shortcut without Stripe keys; refused in production. */
  @Post('dev-complete')
  devComplete(@Body() dto?: DevCompleteDto) {
    if (isProduction()) {
      throw new ForbiddenException('dev payments are disabled in production');
    }
    if (dto?.isPremium !== undefined && typeof dto.isPremium !== 'boolean') {
      throw new BadRequestException('isPremium must be a boolean when provided');
    }
    return this.paymentsService.devComplete(dto?.isPremium ?? true);
  }
}

function validateUrl(value: string | undefined, name: string): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || !/^https?:\/\//.test(value)) {
    throw new BadRequestException(`${name} must be an http(s) URL when provided`);
  }
}
