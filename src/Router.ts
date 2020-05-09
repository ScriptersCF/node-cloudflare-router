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

const DefaultRouterOptions: RouterSetup = {
    middlewareWaterfall: true
};

export default class Router {
    public routes: Array<RouteObject>;
    public errorHandler: Function | null;
    public responseHandler: Function | null;
    public basePath: string | null;
    public main: Router | null;
    public allRoutes: null | Array<RouteObject>;
    public setup: RouterSetup;

    constructor (setup: RouterSetup = DefaultRouterOptions) {
        this.main = null;
        this.routes = [];
        this.errorHandler = null;
        this.responseHandler = null;
        this.basePath = null;
        this.allRoutes = null;
        this.setup = {
            ...DefaultRouterOptions,
            ...setup
        };
    }


    public fixPath (path: string): string {
        path = `${this.basePath || "/"}${path.startsWith("/") ? path.slice(1) : path}`;

        if (!path.endsWith("/")) {
            path += "/";
        }

        return path;
    }

    public updateBasePath (basePath?: string): void {
        this.basePath = null;
        this.basePath = this.fixPath(basePath || "/");
        const updatedRoutes: RouteObject[] = [];

        for (const route of this.routes) {
            const newFixedPath = this.fixPath(route.originalPath);
            const newRoute: RouteObject = {
                ...route,
                path: newFixedPath,
                pathPattern: new UrlPattern(newFixedPath)
            };

            updatedRoutes.push(newRoute);
        }

        this.routes = updatedRoutes;
    }

    public addRoute (options: RouteOptions): void {
        const fixedPath = this.fixPath(options.path);
        const pathPattern = new UrlPattern(fixedPath);
        const route: RouteObject = {
            ...options,
            method: options.method.toLowerCase(),
            path: fixedPath,
            originalPath: options.path,
            pathPattern,
            middleware: typeof options.middleware !== "undefined" ? options.middleware : !(options.handler instanceof Router)
        };

        this.routes.push(route);
    }

    public use (path: string, handler: RouterHandlerCallback | Router) {
        if (handler instanceof Function) {
            this.addRoute({
                middleware: true,
                path,
                handler,
                method: "*"
            });
        } else {
            // This ensures that when someone adds a route to that router, it will work
            path = this.fixPath(path);
            handler.updateBasePath(path);
            this.addRoute({
                middleware: false,
                path,
                handler,
                method: "*"
            });
        }
    }

    public get (path: string, handler: RouterHandlerCallback): void {
        this.addRoute({
            middleware: false,
            path,
            method: "get",
            handler
        });
    }

    public post (path: string, handler: RouterHandlerCallback): void {
        this.addRoute({
            middleware: false,
            path,
            method: "post",
            handler
        });
    }

    public options (path: string, handler: RouterHandlerCallback): void {
        this.addRoute({
            middleware: false,
            path,
            method: "options",
            handler
        });
    }

    public head (path: string, handler: RouterHandlerCallback): void {
        this.addRoute({
            middleware: false,
            path,
            method: "head",
            handler
        });
    }

    public delete (path: string, handler: RouterHandlerCallback): void {
        this.addRoute({
            middleware: false,
            path,
            method: "delete",
            handler
        });
    }

    public getRoutes (caller?: Router): Array<RouteObject> {
        if (!caller) {
            // This is the main router
            if (!this.allRoutes) {
                this.allRoutes = [];
            } else {
                return this.allRoutes;
            }

            for (const route of this.routes) {
                if (route.handler instanceof Router) {
                    const subRoutes = route.handler.getRoutes(this);
                    for (const subRoute of subRoutes) {
                        this.allRoutes.push(subRoute);
                    }
                } else {
                    this.allRoutes.push(route);
                }
            }

            return this.allRoutes;
        } else {
            let routes = this.routes;
            const cleanRoutes = routes.filter(route => !(route.handler instanceof Router));

            for (const route of routes) {
                if (route.handler instanceof Router) {
                    routes = [...cleanRoutes, ...route.handler.getRoutes(caller)];
                }
            }

            return routes;
        }
    }

    async serve (rawRequest: EventRequest, extraOptions: unknown): Promise<Response> {
        const request = new RouterRequest(rawRequest);
        const response = new RouterResponse(request);

        const processRequest = async (): Promise<unknown> => {
            this.allRoutes = this.getRoutes();
            const foundRoutes = this.allRoutes.filter(route => route.pathPattern.match(request.path));
            const middlewareRoutes = foundRoutes.filter(route => route.middleware);
            const handlerRoutes = foundRoutes.filter(route => route.method === request.method);

            if (!this.setup.middlewareWaterfall) {
                // Do all middlewares at the same time
                await Promise.all(middlewareRoutes.map(middleware => middleware.handler instanceof Function && middleware.handler(request, response, extraOptions)));
            } else {
                // Chronologically go through the middlewares and wait for one to finish before moving on
                for (const middleware of middlewareRoutes) {
                    if (middleware && middleware.handler instanceof Function) {
                        // eslint-disable-next-line no-await-in-loop
                        await middleware.handler(request, response, extraOptions);
                    } else {
                        throw new Error("Unexpected middleware type");
                    }

                    // If one middleware "finished the job", then stop the process
                    if (response.finalized) return null;
                }
            }

            if (!response.finalized) {
                let foundRoute: { matched?: unknown; route?: RouteObject } = {};

                for (const route of handlerRoutes) {
                    const matched: null | { [key: string]: string } = route.pathPattern.match(request.path);

                    if (matched) {
                        request.params = matched;

                        foundRoute = {
                            matched,
                            route
                        };

                        break;
                    }
                }

                if (foundRoute) {
                    if (foundRoute.route) {
                        if (foundRoute.route.handler instanceof Function) {
                            // To prevent the "await" part from erroring, we create a "fake" custom async function
                            await (async () => foundRoute && foundRoute.route && foundRoute.route.handler && foundRoute.route.handler instanceof Function && foundRoute.route.handler(request, response, extraOptions))()
                                .catch((error: Error) => {
                                    throw error;
                                });
                            return null;
                        } else {
                            throw new Error("No attached handler that is a function");
                        }
                    } else {
                        throw new Error("No attached route");
                    }
                } else {
                    throw new Error("No route found 2");
                }
            } else {
                return null;
            }
        };

        const error = await processRequest()
            .catch((e: Error) => e);

        if (error instanceof Error) {
            if (this.errorHandler) {
                return this.errorHandler(error, response, request);
            } else {
                throw error;
            }
        }


        const [formattedResponse, tasks] = response.format();

        if (this.responseHandler) {
            return this.responseHandler(response, request, tasks);
        } else {
            return formattedResponse;
        }
    }
}
