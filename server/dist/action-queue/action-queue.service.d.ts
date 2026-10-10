import { Decision, DecisionView } from './decision.js';
export declare class ActionQueueService {
    private nextId;
    private readonly decisions;
    enqueue(decision: Decision): DecisionView;
    list(): DecisionView[];
    get(id: number): DecisionView;
    resolve(id: number, actionId: string, payload?: Record<string, unknown>): Promise<unknown>;
    count(): number;
}
