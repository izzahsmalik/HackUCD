import { EntityRepository } from '@mikro-orm/core';
import { AppSetting } from './app-setting.entity.js';
export declare class PremiumService {
    private readonly settingRepository;
    constructor(settingRepository: EntityRepository<AppSetting>);
    getIsPremium(): Promise<boolean>;
    setIsPremium(value: boolean): Promise<void>;
}
