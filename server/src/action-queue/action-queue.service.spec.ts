import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decision } from './decision.js';
import { ActionQueueService } from './action-queue.service.js';

class StubDecision extends Decision {
  readonly type = 'stub';
  readonly summary = 'a stub decision';
  readonly actions = [
    { id: 'do', label: 'Do it', payload: { value: 'number' as const } },
    { id: 'discard', label: 'Discard' },
  ];
  readonly data = { some: 'data' };

  appliedActionId?: string;

  async apply(actionId: string): Promise<unknown> {
    if (actionId === 'do') {
      this.appliedActionId = actionId;
      return { done: true };
    }
    throw new BadRequestException(`Unknown action '${actionId}'`);
  }
}

describe('ActionQueueService', () => {
  let queue: ActionQueueService;

  beforeEach(() => {
    queue = new ActionQueueService();
  });

  it('enqueue assigns sequential ids and the view exposes the decision', () => {
    const first = queue.enqueue(new StubDecision());
    const second = queue.enqueue(new StubDecision());
    expect(first.id).toBe(1);
    expect(second.id).toBe(2);
    expect(first).toEqual({
      id: 1,
      type: 'stub',
      summary: 'a stub decision',
      actions: expect.any(Array),
      data: { some: 'data' },
    });
  });

  it('list returns all pending decisions', () => {
    queue.enqueue(new StubDecision());
    queue.enqueue(new StubDecision());
    expect(queue.list()).toHaveLength(2);
    expect(queue.count()).toBe(2);
  });

  it('get throws NotFoundException for an unknown id', () => {
    expect(() => queue.get(99)).toThrow(NotFoundException);
  });

  it('resolve applies the action and removes the decision', async () => {
    const decision = new StubDecision();
    const view = queue.enqueue(decision);
    await expect(queue.resolve(view.id, 'do', { value: 1 })).resolves.toEqual({
      done: true,
    });
    expect(decision.appliedActionId).toBe('do');
    expect(queue.count()).toBe(0);
    expect(() => queue.get(view.id)).toThrow(NotFoundException);
  });

  it('resolve keeps the decision when apply throws', async () => {
    const view = queue.enqueue(new StubDecision());
    await expect(queue.resolve(view.id, 'unknown-action')).rejects.toThrow(
      BadRequestException,
    );
    expect(queue.count()).toBe(1);
  });
});
