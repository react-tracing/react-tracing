declare module "zipkin-javascript-opentracing" {
	const moduleContent: any;

	export = moduleContent;
}
declare namespace NodeJS {
	interface Global {
		fetch: (...args: Array<any>) => Promise<Array<any>>;
	}
}
