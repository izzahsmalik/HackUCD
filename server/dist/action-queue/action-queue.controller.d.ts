import { ActionQueueService } from './action-queue.service.js';
export interface ResolveDecisionDto {
    actionId: string;
    payload?: Record<string, unknown>;
}
export declare class ActionQueueController {
    private readonly actionQueueService;
    constructor(actionQueueService: ActionQueueService);
    list(): import("./decision.js").DecisionView[];
    get(id: number): import("./decision.js").DecisionView;
    resolve(id: number, dto: ResolveDecisionDto): Promise<unknown>;
}
