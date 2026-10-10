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
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { AppSetting } from './app-setting.entity.js';
import { PREMIUM_SETTING_KEY } from './payments.constants.js';
let PremiumService = class PremiumService {
    settingRepository;
    constructor(settingRepository) {
        this.settingRepository = settingRepository;
    }
    async getIsPremium() {
        const setting = await this.settingRepository.findOne({
            key: PREMIUM_SETTING_KEY,
        });
        if (!setting) {
            const seeded = this.settingRepository.create({
                key: PREMIUM_SETTING_KEY,
                value: 'false',
            });
            await this.settingRepository.getEntityManager().persist(seeded).flush();
            return false;
        }
        return setting.value === 'true';
    }
    async setIsPremium(value) {
        const setting = await this.settingRepository.findOne({
            key: PREMIUM_SETTING_KEY,
        });
        if (setting) {
            this.settingRepository.assign(setting, { value: String(value) });
        }
        else {
            const created = this.settingRepository.create({
                key: PREMIUM_SETTING_KEY,
                value: String(value),
            });
            this.settingRepository.getEntityManager().persist(created);
        }
        await this.settingRepository.getEntityManager().flush();
    }
};
PremiumService = __decorate([
    Injectable(),
    __param(0, InjectRepository(AppSetting)),
    __metadata("design:paramtypes", [EntityRepository])
], PremiumService);
export { PremiumService };
//# sourceMappingURL=premium.service.js.map