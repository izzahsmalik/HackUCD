import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PremiumGuard } from '../payments/premium.guard.js';
import { QueryController } from './query.controller.js';
import { QueryService } from './query.service.js';

const queryService = {
  ask: vi.fn(),
  planOnly: vi.fn(),
};

describe('QueryController', () => {
  let controller: QueryController;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Always-premium guard stub: the guard's own e2e lives in test/.
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [QueryController],
      providers: [{ provide: QueryService, useValue: queryService }],
    })
      .overrideGuard(PremiumGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get<QueryController>(QueryController);
  });

  describe('ask', () => {
    it('delegates to the service', async () => {
      queryService.ask.mockResolvedValue({ answer: 'ok', plan: {}, data: {} });
      await expect(controller.ask({ question: 'How much?' })).resolves.toEqual({
        answer: 'ok',
        plan: {},
        data: {},
      });
      expect(queryService.ask).toHaveBeenCalledWith('How much?', undefined);
    });

    it('passes the trimmed model through', async () => {
      queryService.ask.mockResolvedValue({ answer: 'ok', plan: {}, data: {} });
      await controller.ask({
        question: 'How much?',
        model: ' openai/gpt-4o-mini ',
      });
      expect(queryService.ask).toHaveBeenCalledWith(
        'How much?',
        'openai/gpt-4o-mini',
      );
    });

    it('rejects a missing or empty question', () => {
      expect(() => controller.ask({} as { question: string })).toThrow(
        BadRequestException,
      );
      expect(() => controller.ask({ question: '   ' })).toThrow(
        BadRequestException,
      );
      expect(queryService.ask).not.toHaveBeenCalled();
    });

    it('rejects a blank or oversized model', () => {
      expect(() =>
        controller.ask({ question: 'q', model: '   ' }),
      ).toThrow(BadRequestException);
      expect(() =>
        controller.ask({ question: 'q', model: 'x'.repeat(201) }),
      ).toThrow(BadRequestException);
      expect(() =>
        controller.ask({ question: 'q', model: 5 as never }),
      ).toThrow(BadRequestException);
      expect(queryService.ask).not.toHaveBeenCalled();
    });
  });

  describe('plan', () => {
    it('delegates to planOnly', async () => {
      queryService.planOnly.mockResolvedValue({
        plan: { entity: 'transactions' },
      });
      await expect(controller.plan({ question: 'How much?' })).resolves.toEqual(
        { plan: { entity: 'transactions' } },
      );
      expect(queryService.planOnly).toHaveBeenCalledWith('How much?', undefined);
    });

    it('passes the model through to planOnly', async () => {
      queryService.planOnly.mockResolvedValue({ plan: {} });
      await controller.plan({ question: 'q', model: 'some/model' });
      expect(queryService.planOnly).toHaveBeenCalledWith('q', 'some/model');
    });

    it('rejects an empty question', () => {
      expect(() => controller.plan({ question: '' })).toThrow(
        BadRequestException,
      );
      expect(queryService.planOnly).not.toHaveBeenCalled();
    });
  });
});
