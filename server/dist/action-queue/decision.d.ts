export interface DecisionAction {
    id: string;
    label: string;
    payload?: Record<string, 'number' | 'string'>;
}
export interface DecisionView {
    id: number;
    type: string;
    summary: string;
    actions: DecisionAction[];
    data: unknown;
}
export declare abstract class Decision {
    abstract readonly type: string;
    abstract readonly summary: string;
    abstract readonly actions: DecisionAction[];
    abstract readonly data: unknown;
    abstract apply(actionId: string, payload?: Record<string, unknown>): Promise<unknown>;
    view(id: number): DecisionView;
    protected payloadNumber(payload: Record<string, unknown> | undefined, field: string): number;
    protected payloadString(payload: Record<string, unknown> | undefined, field: string): string;
}
