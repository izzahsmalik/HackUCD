var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, NotFoundException } from '@nestjs/common';
let ActionQueueService = class ActionQueueService {
    nextId = 1;
    decisions = new Map();
    enqueue(decision) {
        const id = this.nextId++;
        this.decisions.set(id, decision);
        return decision.view(id);
    }
    list() {
        return [...this.decisions.entries()].map(([id, decision]) => decision.view(id));
    }
    get(id) {
        const decision = this.decisions.get(id);
        if (!decision)
            throw new NotFoundException(`Decision #${id} not found`);
        return decision.view(id);
    }
    async resolve(id, actionId, payload) {
        const decision = this.decisions.get(id);
        if (!decision)
            throw new NotFoundException(`Decision #${id} not found`);
        const result = await decision.apply(actionId, payload);
        this.decisions.delete(id);
        return result;
    }
    count() {
        return this.decisions.size;
    }
};
ActionQueueService = __decorate([
    Injectable()
], ActionQueueService);
export { ActionQueueService };
//# sourceMappingURL=action-queue.service.js.map