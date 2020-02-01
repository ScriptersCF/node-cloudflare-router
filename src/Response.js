const cookie = require("cookie");
const contentTypes = {};

/**
 * @type {RouterResponse}
 */
class RouterResponse {
	/**
	 * Constructs a response
	 * @param {Request} request The request
	 */
	constructor (request) {
		this.request = request;
		this.finalized = false;
		this.response = {
			code: 200,
			status: "OK",
			headers: {},
			cookies: {},
			tasks: [],
			responseType: "text",
			body: null,
			redirect: null
		};
	}

	/**
	 * Sets the body to JSON
	 * @param {Object} data The data
	 * @returns {RequestResponse}
	 */
	json (data) {
		this.response.body = JSON.stringify(data);
		this.response.responseType = "application/json";
		return this;
	}

	/**
	 * Sets the raw body and type
	 * @param {any} body The body
	 * @param {string} type The content-type
	 * @returns {RequestResponse}
	 */
	raw (body, type) {
		this.response.body = body;
		this.response.responseType = type;
		return this;
	}

	/**
	 * Sets the status for the response
	 * @param {string} text The status
	 * @returns {RequestResponse}
	 */
	status (text) {
		this.response.status = text;
		return this;
	}

	/**
	 * Responds with only text
	 * @param {string} text Text to respond with
	 * @returns {RequestResponse}
	 */
	text (text) {
		this.response.body = text;
		this.response.type = "text/plain";
		return this;
	}

	/**
	 * Sets status code for the response
	 * @param {number} code The status code
	 * @returns {RequestResponse}
	 */
	code (code) {
		this.response.code = code;
		return this;
	}

	/**
	 * Sets tasks you can perform after the request using event.waitUntil()
	 * @param {Promise[]} tasks The tasks
	 * @returns {RequestResponse}
	 */
	tasks (tasks) {
		tasks = Array.isArray(tasks) ? tasks : [tasks];
		if (this.response.tasks && Array.isArray(this.response.tasks)) {
			this.response.tasks = [...this.response.tasks, ...tasks];
		} else {
			this.response.tasks = tasks;
		}
		return this;
	}

	/**
	 * Sets a header
	 * @param {string} key The header key
	 * @param {string} value The header value
	 * @returns {RequestResponse}
	 */
	setHeader (key, value) {
		this.response.headers[key] = value;
		return this;
	}

	/**
	 * Sets a cookie
	 * @param {string} key The key
	 * @param {string} value The value
	 * @param {Object} options The options
	 * @returns {RequestResponse}
	 */
	setCookie (key, value, options = {}) {
		this.response.cookies[key] = {
			value,
			options
		};
		return this;
	}

	/**
	 * Use this instead of chaining methods (not necessary)
	 * @param {{ code: number, status: string, tasks: Promise[], body: any, type: string }} data The data
	 * @returns {RequestResponse}
	 */
	end (data = {}) {
		const { code, status, tasks, body, type } = data;
		if (code) this.response.code = code;
		if (status) this.response.status = status;
		if (tasks) this.response.tasks = tasks;
		if (body) this.response.body = body;
		if (type) this.response.responseType = type;

		this.finalized = true;
		return this;
	}

	/**
	 * Redirects the request
	 * @param {string} url The URL to redirect to
	 * @param {number} status The redirect status code
	 */
	redirect (url, status) {
		this.response.redirect = {
			url,
			status
		};

		return this;
	}

	/**
	 * Creates a native Response with body and init
	 * @param {any} body The body
	 * @param {Object} init The options
	 */
	custom (body, init) {
		this._custom = new Response(body, init);
		return this;
	}

	/**
	 * This formats this response into an acceptable format for the worker to respond with
	 * @returns {(Response|[]|*[])[]|(Response|RequestResponse|[]|*[])[]}
	 * @private
	 */
	_format () {
		if (this._custom) {
			return [
				this._custom,
				this.response.tasks || []
			]
		}

		if (this.response.tasks) {
			this.response.tasks = Array.isArray(this.response.tasks) ? this.response.tasks : [this.response.tasks];
		}

		if (!this.response.redirect) {
			const extraData = {
				statusText: this.response.status || "OK",
				status: this.response.code || 200,
				headers: this.response.headers || {}
			};
			const body = this.response.body;
			const cookies = this.response.cookies;

			if (cookies) {
				let totalCookies = "";
				Object.keys(cookies)
					.every(k => {
						const { value, options } = cookies[k];
						let newCookie = cookie.serialize(k, value, options);
						totalCookies += `${newCookie};`;
					});

				extraData.headers["Set-Cookie"] = totalCookies;
			}

			if (this.response.responseType) {
				extraData.headers["Content-Type"] = this.response.responseType;
			}

			const returnResponse = new Response(body, extraData);
			return [
				returnResponse,
				this.response.tasks || []
			];
		} else {
			return [
				Response.redirect(this.response.redirect.url, this.response.redirect.status || 302),
				this.response.tasks || []
			];
		}
	}
}

module.exports = RouterResponse;
