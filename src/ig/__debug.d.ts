declare module "__debug" {
	export interface ModuleInternals {
		defaultExport: any,
		exports: any,
	}

	export const modulesMap: {[key: string]: ModuleInternals};
}
