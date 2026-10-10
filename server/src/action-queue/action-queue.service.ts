import { Injectable, NotFoundException } from '@nestjs/common';
import { Decision, DecisionView } from './decision.js';

/**
 * In-memory queue of LLM decisions awaiting human resolution. Not persisted:
 * pending decisions are lost when the process restarts.
 */
@Injectable()
export class ActionQueueService {
  private nextId = 1;
  private readonly decisions = new Map<number, Decision>();

  enqueue(decision: Decision): DecisionView {
    const id = this.nextId++;
    this.decisions.set(id, decision);
    return decision.view(id);
  }

  list(): DecisionView[] {
    return [...this.decisions.entries()].map(([id, decision]) =>
      decision.view(id),
    );
  }

  get(id: number): DecisionView {
    const decision = this.decisions.get(id);
    if (!decision) throw new NotFoundException(`Decision #${id} not found`);
    return decision.view(id);
  }

  /** Applies the chosen action and removes the decision from the queue. */
  async resolve(
    id: number,
    actionId: string,
    payload?: Record<string, unknown>,
  ): Promise<unknown> {
    const decision = this.decisions.get(id);
    if (!decision) throw new NotFoundException(`Decision #${id} not found`);
    const result = await decision.apply(actionId, payload);
    this.decisions.delete(id);
    return result;
  }

  count(): number {
    return this.decisions.size;
  }
}
