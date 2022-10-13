declare module "__debug" {
	export interface ModuleInternals {
		factoryFinished: boolean,
		defaultExport: any,
		exports: any,
	}

	export const modulesMap: {[key: string]: ModuleInternals};
}
