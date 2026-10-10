import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [QueryController],
      providers: [{ provide: QueryService, useValue: queryService }],
    }).compile();

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
      expect(queryService.ask).toHaveBeenCalledWith('How much?');
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
  });

  describe('plan', () => {
    it('delegates to planOnly', async () => {
      queryService.planOnly.mockResolvedValue({
        plan: { entity: 'transactions' },
      });
      await expect(controller.plan({ question: 'How much?' })).resolves.toEqual(
        { plan: { entity: 'transactions' } },
      );
      expect(queryService.planOnly).toHaveBeenCalledWith('How much?');
    });

    it('rejects an empty question', () => {
      expect(() => controller.plan({ question: '' })).toThrow(
        BadRequestException,
      );
      expect(queryService.planOnly).not.toHaveBeenCalled();
    });
  });
});
