import { defineEntity, p } from '@mikro-orm/core';
export const AppSettingSchema = defineEntity({
    name: 'AppSetting',
    tableName: 'app_settings',
    properties: {
        key: p.string().primary(),
        value: p.string(),
    },
});
export class AppSetting extends AppSettingSchema.class {
}
AppSettingSchema.setClass(AppSetting);
//# sourceMappingURL=app-setting.entity.js.map