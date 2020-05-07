"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const url_pattern_1 = tslib_1.__importDefault(require("url-pattern"));
const Request_1 = tslib_1.__importDefault(require("./Request"));
const Response_1 = tslib_1.__importDefault(require("./Response"));
const DefaultRouterOptions = {
    middlewareWaterfall: true
};
class Router {
    constructor(setup = DefaultRouterOptions) {
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
    fixPath(path) {
        path = `${this.basePath || "/"}${path.startsWith("/") ? path.slice(1) : path}`;
        if (!path.endsWith("/")) {
            path += "/";
        }
        return path;
    }
    updateBasePath(basePath) {
        this.basePath = basePath || "/";
        const updatedRoutes = [];
        for (const route of this.routes) {
            const newFixedPath = this.fixPath(route.originalPath);
            const newRoute = {
                ...route,
                path: newFixedPath,
                pathPattern: new url_pattern_1.default(newFixedPath)
            };
            updatedRoutes.push(newRoute);
        }
        this.routes = updatedRoutes;
    }
    addRoute(options) {
        const fixedPath = this.fixPath(options.path);
        const pathPattern = new url_pattern_1.default(fixedPath);
        const route = {
            ...options,
            method: options.method.toLowerCase(),
            path: fixedPath,
            originalPath: options.path,
            pathPattern,
            middleware: typeof options.middleware !== "undefined" ? options.middleware : !(options.handler instanceof Router)
        };
        this.routes.push(route);
    }
    use(path, handler) {
        if (handler instanceof Function) {
            this.addRoute({
                middleware: true,
                path,
                handler,
                method: "*"
            });
        }
        else {
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
    get(path, handler) {
        this.addRoute({
            middleware: false,
            path,
            method: "get",
            handler
        });
    }
    post(path, handler) {
        this.addRoute({
            middleware: false,
            path,
            method: "post",
            handler
        });
    }
    options(path, handler) {
        this.addRoute({
            middleware: false,
            path,
            method: "options",
            handler
        });
    }
    head(path, handler) {
        this.addRoute({
            middleware: false,
            path,
            method: "head",
            handler
        });
    }
    delete(path, handler) {
        this.addRoute({
            middleware: false,
            path,
            method: "delete",
            handler
        });
    }
    getRoutes(caller) {
        if (!caller) {
            if (!this.allRoutes) {
                this.allRoutes = [];
            }
            else {
                return this.allRoutes;
            }
            for (const route of this.routes) {
                if (route.handler instanceof Router) {
                    const subRoutes = route.handler.getRoutes(this);
                    for (const subRoute of subRoutes) {
                        this.allRoutes.push(subRoute);
                    }
                }
                else {
                    this.allRoutes.push(route);
                }
            }
            return this.allRoutes;
        }
        else {
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
    async serve(rawRequest) {
        const request = new Request_1.default(rawRequest);
        const response = new Response_1.default(request);
        const processRequest = async () => {
            this.allRoutes = this.getRoutes();
            const foundRoutes = this.allRoutes.filter(route => route.pathPattern.match(request.path));
            const middlewareRoutes = foundRoutes.filter(route => route.middleware);
            const handlerRoutes = foundRoutes.filter(route => route.method === request.method);
            if (!this.setup.middlewareWaterfall) {
                await Promise.all(middlewareRoutes.map(middleware => middleware.handler instanceof Function && middleware.handler(request, response)));
            }
            else {
                for (const middleware of middlewareRoutes) {
                    if (middleware && middleware.handler instanceof Function) {
                        await middleware.handler(request, response);
                    }
                    else {
                        throw new Error("Unexpected middleware type");
                    }
                    if (response.finalized)
                        return null;
                }
            }
            if (!response.finalized) {
                let foundRoute = {};
                for (const route of handlerRoutes) {
                    const matched = route.pathPattern.match(request.path);
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
                            await (async () => foundRoute && foundRoute.route && foundRoute.route.handler && foundRoute.route.handler instanceof Function && foundRoute.route.handler(request, response))()
                                .catch((error) => {
                                throw error;
                            });
                            return null;
                        }
                        else {
                            throw new Error("No attached handler that is a function");
                        }
                    }
                    else {
                        throw new Error("No attached route");
                    }
                }
                else {
                    throw new Error("No route found 2");
                }
            }
            else {
                return null;
            }
        };
        const error = await processRequest()
            .catch((e) => e);
        if (error instanceof Error) {
            if (this.errorHandler) {
                return this.errorHandler(error, response, request);
            }
            else {
                throw error;
            }
        }
        const [formattedResponse, tasks] = response.format();
        if (this.responseHandler) {
            return this.responseHandler(response, request, tasks);
        }
        else {
            return formattedResponse;
        }
    }
}
exports.default = Router;
