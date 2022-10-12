declare module "IG_PolarisDarkModeQEUtils" {

    /**
     * A/B test?
     */
    export function hasDarkModeToggleEnabled(): boolean;

    /**
     * Analytics.
     */
    export function maybeLogDarkModeQEExposure(): unknown;

}
