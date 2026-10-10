import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { AppSetting } from './app-setting.entity.js';
import { PREMIUM_SETTING_KEY } from './payments.constants.js';

/**
 * Reads and writes the single global premium flag, stored as an app_settings
 * row so the free/premium tier survives restarts without a user model.
 */
@Injectable()
export class PremiumService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settingRepository: EntityRepository<AppSetting>,
  ) {}

  /** Reads the flag, seeding the row to 'false' on first access. */
  async getIsPremium(): Promise<boolean> {
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

  async setIsPremium(value: boolean): Promise<void> {
    const setting = await this.settingRepository.findOne({
      key: PREMIUM_SETTING_KEY,
    });
    if (setting) {
      this.settingRepository.assign(setting, { value: String(value) });
    } else {
      const created = this.settingRepository.create({
        key: PREMIUM_SETTING_KEY,
        value: String(value),
      });
      this.settingRepository.getEntityManager().persist(created);
    }
    await this.settingRepository.getEntityManager().flush();
  }
}
