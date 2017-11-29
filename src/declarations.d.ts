declare namespace NodeJS {
	interface Global {
		fetch: (...args: Array<any>) => Promise<Array<any>>;
	}
}
