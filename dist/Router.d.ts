import UrlPattern from "url-pattern";
import { EventRequest } from "./Interfaces";
import RouterRequest from "./Request";
import RouterResponse from "./Response";
export declare type RouterHandlerCallback = (request: RouterRequest, response: RouterResponse, extraOptions?: unknown) => void;
export declare type RouteOptions = {
    method: string;
    path: string;
    handler: Function | Router;
    middleware?: boolean;
};
export declare type RouteObject = {
    method: string;
    pathPattern: UrlPattern;
    path: string;
    originalPath: string;
    handler: Function | Router;
    middleware: boolean;
};
export declare type RouterSetup = {
    middlewareWaterfall: boolean;
};
export default class Router {
    routes: Array<RouteObject>;
    errorHandler: Function | null;
    responseHandler: Function | null;
    basePath: string | null;
    main: Router | null;
    allRoutes: null | Array<RouteObject>;
    setup: RouterSetup;
    constructor(setup?: RouterSetup);
    fixPath(path: string): string;
    updateBasePath(basePath?: string): void;
    addRoute(options: RouteOptions): void;
    use(path: string, handler: RouterHandlerCallback | Router): void;
    get(path: string, handler: RouterHandlerCallback): void;
    post(path: string, handler: RouterHandlerCallback): void;
    options(path: string, handler: RouterHandlerCallback): void;
    head(path: string, handler: RouterHandlerCallback): void;
    delete(path: string, handler: RouterHandlerCallback): void;
    getRoutes(caller?: Router): Array<RouteObject>;
    serve(rawRequest: EventRequest, extraOptions: unknown): Promise<Response>;
}
