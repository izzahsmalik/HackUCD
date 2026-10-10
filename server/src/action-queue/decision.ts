import { BadRequestException } from '@nestjs/common';

/**
 * One action a human can take on a decision. `payload` declares the field
 * names and types the action expects, so a generic UI can render forms
 * dynamically without knowing the decision type.
 */
export interface DecisionAction {
  id: string; // e.g. 'match-product', 'create-product', 'categorize', 'discard'
  label: string; // user-facing, e.g. 'Match to an existing product'
  payload?: Record<string, 'number' | 'string'>;
}

/** Serializable shape the controller returns; apply() logic stays in the instance. */
export interface DecisionView {
  id: number;
  type: string; // 'product' | 'transaction' | ... extensible
  summary: string;
  actions: DecisionAction[];
  data: unknown; // row data + candidates, per concrete class
}

/**
 * A pending LLM decision queued for human resolution. Subclasses hold the data
 * needed to create their relevant models and implement apply() for each action
 * they declare. Add new decision types by subclassing — the queue is generic
 * over Decision.
 */
export abstract class Decision {
  abstract readonly type: string;
  abstract readonly summary: string;
  abstract readonly actions: DecisionAction[];
  abstract readonly data: unknown;

  /** Applies the chosen action and returns its result. Throws BadRequestException on an unknown action or bad payload. */
  abstract apply(
    actionId: string,
    payload?: Record<string, unknown>,
  ): Promise<unknown>;

  view(id: number): DecisionView {
    return {
      id,
      type: this.type,
      summary: this.summary,
      actions: this.actions,
      data: this.data,
    };
  }

  protected payloadNumber(
    payload: Record<string, unknown> | undefined,
    field: string,
  ): number {
    const value = payload?.[field];
    if (!Number.isInteger(value) || (value as number) <= 0) {
      throw new BadRequestException(`'${field}' must be a positive integer`);
    }
    return value as number;
  }

  protected payloadString(
    payload: Record<string, unknown> | undefined,
    field: string,
  ): string {
    const value = payload?.[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`'${field}' must be a non-empty string`);
    }
    return value;
  }
}
