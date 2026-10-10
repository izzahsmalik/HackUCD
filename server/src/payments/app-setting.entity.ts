import { defineEntity, p } from '@mikro-orm/core';

export const AppSettingSchema = defineEntity({
  name: 'AppSetting',
  tableName: 'app_settings',
  properties: {
    key: p.string().primary(), // natural key, e.g. 'isPremium'
    value: p.string(), // serialized value; booleans are 'true'/'false'
  },
});

export class AppSetting extends AppSettingSchema.class {}
AppSettingSchema.setClass(AppSetting);
