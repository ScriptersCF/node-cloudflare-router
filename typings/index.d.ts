declare module "cf-router" {
    import * as UrlPattern from "url-pattern";

    class Router {
        public _main: Router | null;
        public _initiated: boolean;
        public routes: Array<Route>;
        public errorHandler: Function | null;
        public responseHandler: Function | null;
        public basePath: string | null;

        public use(path: string, handler: Function | Router): void;
        public get(path: string, handler: (request: RouterRequest, response: RouterResponse) => void);
        public post(path: string, handler: (request: RouterRequest, response: RouterResponse) => void);
        public head(path: string, handler: (request: RouterRequest, response: RouterResponse) => void);
        public options(path: string, handler: (request: RouterRequest, response: RouterResponse) => void);
        public delete(path: string, handler: (request: RouterRequest, response: RouterResponse) => void);
    }

    class RouterRequest {
        public url: string;
        public request: Request;
        public _url: URL;
        public path: string;
        public query: Object;
        public method: string;
        public body: any | ReadableStream;
        public bodyUsed: boolean;
        public headers: Object;
        public cookies: Object;
        public response: RouterResponse;

        public _fetchValues (request: RouterRequest): void;
        public _fixUrl (url: string): string;
        public json (): Object | null;
        public blob (): Blob | null;
        public formData (): FormData | null;
        public text (): string | null;
        public arrayBuffer (): ArrayBuffer | null;
    }


    class RouterResponse {
        public request: RouterRequest;
        public finalized: boolean;
        public response: {
            code: number,
            status: string,
            headers: Object,
            cookies: Object,
            tasks: Promise<any>[],
            responseType: string,
            body: any,
            redirect: null | {
                url: string,
                status: number
            }
        };

        public json (data: Object): RouterResponse;
        public raw (body: any, type: string): RouterResponse;
        public status (status: string): RouterResponse;
        public text (text: string): RouterResponse;
        public code (statusCode: number): RouterResponse;
        public tasks (tasks: Promise<any>[]): RouterResponse;
        public setHeader(key: string, value: string): RouterResponse;
        public setCookie (key: string, value: string): RouterResponse;
        public end(data: { code: number, status: string, tasks: Promise<any>[], body: any, type: string }): RouterResponse;
        public redirect (url: string, code: number): RouterResponse;
        public custom (body: any, init: any): RouterResponse;
        public _format (): any;
    }

    interface Route {
        rawPath: string,
        path: UrlPattern,
        handler: Function | Router,
        middleware: boolean,
        num: number
    }

    export = Router;
}
