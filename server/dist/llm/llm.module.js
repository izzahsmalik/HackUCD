var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { LlmModel } from './llm.model.js';
let LlmModule = class LlmModule {
};
LlmModule = __decorate([
    Module({
        providers: [
            {
                provide: LlmModel,
                useFactory: () => {
                    const apiKey = process.env.OPENROUTER_API_KEY;
                    if (!apiKey)
                        throw new Error('OPENROUTER_API_KEY is required for LLM calls');
                    return new LlmModel(process.env.OPENROUTER_MODEL ?? 'microsoft/microsoft-decision-1', {
                        apiKey,
                    });
                },
            },
        ],
        exports: [LlmModel],
    })
], LlmModule);
export { LlmModule };
//# sourceMappingURL=llm.module.js.map