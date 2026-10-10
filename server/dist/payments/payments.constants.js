export const PREMIUM_SETTING_KEY = 'isPremium';
export const DEFAULT_SUCCESS_URL = 'http://localhost:5173/?payment=success';
export const DEFAULT_CANCEL_URL = 'http://localhost:5173/?payment=cancelled';
export const WEBHOOK_TOLERANCE_SECONDS = 300;
export const isProduction = () => process.env.NODE_ENV === 'production';
//# sourceMappingURL=payments.constants.js.map