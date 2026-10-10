var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { TransactionGroup } from './transaction-group.entity.js';
let TransactionGroupsService = class TransactionGroupsService {
    groupRepository;
    constructor(groupRepository) {
        this.groupRepository = groupRepository;
    }
    findAll() {
        return this.groupRepository.findAll();
    }
    async findOne(id) {
        const group = await this.groupRepository.findOne({ id });
        if (!group)
            throw new NotFoundException(`Transaction group #${id} not found`);
        return group;
    }
};
TransactionGroupsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(TransactionGroup)),
    __metadata("design:paramtypes", [EntityRepository])
], TransactionGroupsService);
export { TransactionGroupsService };
//# sourceMappingURL=transaction-groups.service.js.map