/** Key of the app_settings row holding the global premium flag. */
export const PREMIUM_SETTING_KEY = 'isPremium';

/** Where Stripe redirects after checkout; overridable via env and request DTO. */
export const DEFAULT_SUCCESS_URL = 'http://localhost:5173/?payment=success';
export const DEFAULT_CANCEL_URL = 'http://localhost:5173/?payment=cancelled';

/** Stripe's default webhook signature tolerance. */
export const WEBHOOK_TOLERANCE_SECONDS = 300;

/** Dev-only payment shortcuts are refused when running in production. */
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
