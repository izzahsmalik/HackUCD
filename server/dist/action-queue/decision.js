import { BadRequestException } from '@nestjs/common';
export class Decision {
    view(id) {
        return {
            id,
            type: this.type,
            summary: this.summary,
            actions: this.actions,
            data: this.data,
        };
    }
    payloadNumber(payload, field) {
        const value = payload?.[field];
        if (!Number.isInteger(value) || value <= 0) {
            throw new BadRequestException(`'${field}' must be a positive integer`);
        }
        return value;
    }
    payloadString(payload, field) {
        const value = payload?.[field];
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new BadRequestException(`'${field}' must be a non-empty string`);
        }
        return value;
    }
}
//# sourceMappingURL=decision.js.map