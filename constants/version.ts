import Constants from 'expo-constants';

/** App version from app.json; also the key for the "What's new" seen flag. */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '2.0.0';
export const WHATS_NEW_VERSION = '2.0.0';
