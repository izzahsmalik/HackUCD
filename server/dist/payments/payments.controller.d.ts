import { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import type { CheckoutSessionDto, DevCompleteDto } from './dto/payments.dto.js';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getStatus(): Promise<{
        isPremium: boolean;
    }>;
    createCheckoutSession(dto?: CheckoutSessionDto): Promise<{
        url: string | null;
    }>;
    handleWebhook(req: RawBodyRequest<Request>): Promise<{
        received: boolean;
    }>;
    devComplete(dto?: DevCompleteDto): Promise<{
        isPremium: boolean;
    }>;
}
