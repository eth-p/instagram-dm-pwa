declare module "IG_PolarisDarkModeQEUtils" {

    /**
     * A/B test?
     */
    export const hasDarkModeToggleEnabled: () => boolean; 

    /**
     * Analytics.
     */
    export const maybeLogDarkModeQEExposure: () => unknown;

}
