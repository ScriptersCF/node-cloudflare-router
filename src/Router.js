const URLPattern = require("url-pattern"),
	Request = require("./Request"),
	Response = require("./Response");

/**
 * @type {Router}
 */
class Router {
	constructor () {
		this._main = null;
		this._initiated = false;
		this.routes = [];
		this.errorHandler = null;
		this.responseHandler = null;
		this.basePath = null;
	}

	/**
	 * Extends the router
	 * @param {string} path The path
	 * @param {Function || Router} handler The router / function to extend
	 * @returns {null}
	 */
	use (path, handler) {
		if (!(handler instanceof Router)) {
			this.routes.push({
				rawPath: this._path(path),
				path: new URLPattern(this._path(path)),
				handler,
				middleware: true,
				num: this.routes.length + 1
			});
		} else {
			handler.basePath = this._path(path);
			handler.init(this._main || this);
		}
	}

	/**
	 * Callback for handling a request
	 *
	 * @callback handleRequest
	 * @param {RouterRequest} request,
	 * @param {RouterResponse} response
	 */

	/**
	 * Setting up a handler for a GET request to the url
	 * @param {string} path The path to accept
	 * @param {handleRequest} handler
	 */
	get (path, handler) {
		return this._addRoute(path, "get", handler);
	}

	/**
	 * Setting up a handler for a POST request to the url
	 * @param {string} path The path to accept
	 * @param {handleRequest} handler
	 */
	post (path, handler) {
		return this._addRoute(path, "post", handler);
	}

	/**
	 * Setting up a handler for a OPTIONS request to the url
	 * @param {string} path The path to accept
	 * @param {handleRequest} handler
	 */
	options (path, handler) {
		return this._addRoute(path, "options", handler);
	}

	/**
	 * Setting up a handler for a HEAD request to the url
	 * @param {string} path The path to accept
	 * @param {handleRequest} handler
	 */
	head (path, handler) {
		return this._addRoute(path, "head", handler);
	}

	/**
	 * Setting up a handler for a DELETE request to the url
	 * @param {string} path The path to accept
	 * @param {handleRequest} handler
	 */
	delete (path, handler) {
		return this._addRoute(path, "delete", handler);
	}

	/**
	 * Sets up a route "manually"
	 * @param {string} path The path to add for
	 * @param {string} method The method to accept
	 * @param {handleRequest} handler The request handler
	 * @param {boolean} middleware Whether or not the handler is a middleware
	 * @private
	 */
	_addRoute (path, method, handler, middleware) {
		const routeData = {
			rawPath: this._path(path),
			path: new URLPattern(this._path(path)),
			method: (method || "get").toLowerCase(),
			handler
		};

		console.log(`Routed: ${routeData.method.toUpperCase()} ${routeData.rawPath}`);
		if (!middleware) {
			routeData.route = true;
		} else {
			routeData.middleware = true;
		}

		if (!this._initiated) {
			this.routes.push(routeData);
		} else {
			this._main.routes.push(routeData);
		}
	}

	/**
	 * Fixes a given path
	 * @param {string} path The path to fix
	 * @returns {string}
	 * @private
	 */
	_path (path) {
		path = `${this.basePath || "/"}${path.startsWith("/") ? path.slice(1) : path}`;
		if (!path.endsWith("/")) {
			path += "/";
		}

		return path;
	}

	/**
	 * Initiates the current router (only call this from main)
	 * @param {Router | null} main The main router (if none is provided, this router is considered to be it)
	 * @returns {null}
	 */
	init (main) {
		if (this._initiated === true) return;
		if (main === this || !main || this._main === this) {
			this._main = this;
			return; // Skipping, because this instance is main
		}

		this._main = main || this._main || this;
		this._initiated = true;

		// Go through each defined route, and push it to main router
		for (let x = 0; x < this.routes.length; x++) {
			const route = this.routes[x];
			this._addRoute(route.rawPath, route.method, route.handler, route.middleware);
		}
	}

	/**
	 * Serves the request to the router(s)
	 * @param {any} request The request
	 * @param {Object} options The options
	 * @returns {Promise<[Response, [], Request]> | [Response, Request]}
	 */
	async serve (request, options) {
		if (!this._initiated) this.init(this._main ||this);
		if (this._main !== this) return;

		request = request && new Request(request, options);
		let response = new Response(request);
		let allMiddlewaresSuccess = true;
		let returnData;

		const processRequest = async () => {
			const middlewaresMatching = this._main.routes.filter(x => x.middleware === true)
				.sort((a, b) => a - b);
			const routesMatching = this._main.routes.filter(x => x.middleware === undefined || x.middleware === null)
				.filter(x => x.method.toLowerCase() === request.method.toLowerCase());

			// Going through all middlewares that match the path, and everyone have to be successful
			for (let n = 0; n < middlewaresMatching.length; n++) {
				const middleware = middlewaresMatching[n];
				const matched = middleware.path.match(request.path);

				if (matched) {
					try {
						allMiddlewaresSuccess = middleware.handler(request, response);
						if (!allMiddlewaresSuccess) {
							break;
						}
					} catch (e) {
						allMiddlewaresSuccess = false;
						throw new Error(`An error occurred while processing middlewares at middleware #${n}\n ${e}`);
					}
				}
			}

			if (!allMiddlewaresSuccess) {
				throw new Error(`Not all middlewares were successful.`);
			}

			let foundMatchingRoute = false;

			console.log(response);
			if (response.finalized === true) {
				return [response, request];
			} else {
				for (let n = 0; n < routesMatching.length; n++) {
					const route = routesMatching[n];
					const matched = route.path.match(request.path);
					let toBreak = false;
					if (matched) {
						try {
							request.params = matched;
							await route.handler(request, response);
							returnData = [response, request];
							foundMatchingRoute = true;
							toBreak = true;
						} catch (e) {
							returnData = e;
							toBreak = true;
						}
					}

					if (toBreak === true) {
						break;
					}
				}
			}

			if (!(returnData instanceof Error) && !foundMatchingRoute) {
				if (this.noRouteHandler) {
					return this.noRouteHandler(response, request);
				} else {
					returnData = [
						response.code(404).status("Not found").text(`No path for: "${encodeURI(request.path)}"`),
						request
					]
				}
			}

			return returnData;
		};

		let responseData;
		try {
			const data = await processRequest();
			if (!data) {
				responseData = new Error(`Improper data response from route handler.`);
			} else {
				responseData = (!(data instanceof Error) && data[0]) || data;
			}
		} catch (e) {
			responseData = e;
		}

		const dataFormat = ((responseData && responseData instanceof Response) && responseData._format()) || responseData;

		if (dataFormat instanceof Error) {
			if (this.errorHandler) {
				return this.errorHandler(dataFormat, response, request);
			} else {
				throw new Error(dataFormat);
			}
		} else {
			if (this.responseHandler) {
				const [response, tasks] = dataFormat;
				return this.responseHandler(response, tasks, request);
			} else {
				return [...dataFormat, request];
			}
		}

	}
}

module.exports = Router;
