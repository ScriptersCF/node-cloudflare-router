const qs = require("querystring");
const cookie = require("cookie");

class Request {
	constructor (request, options) {
		this.url = this._fixUrl(request.url);
		this._request = request;
		this._url = new URL(this.url);
		this.path = this._url.pathname;
		this.query = qs.parse(this._url.search.slice(1));
		this.method = (request.method || "get").toLowerCase();
		this.body = (request.bodyUsed && request.body) || {};
		this.bodyUsed = request.bodyUsed === true;
		this.headers = {};
		this.cookies = {};

		this._fetchValues(request);
		/**
		 * @type {ReadableStream}
		 */
		this.readStream = this._request.body;
	}

	/**
	 * Fetches general values (headers, cookies, etc.)
	 * @param request
	 * @private
	 * @returns {null}
	 */
	_fetchValues (request) {
		// Get the headers
		const allHeaders = [...request.headers];
		allHeaders.forEach(headerObject => {
			const [name, value] = headerObject;
			this.headers[name.toLowerCase()] = value;
		});
		// Get the cookies
		this.cookies = cookie.parse(this.headers.cookie || "");
	}

	/**
	 * Fixes the URL
	 * @param {string} url The URL to fix
	 * @returns {string}
	 * @private
	 */
	_fixUrl (url) {
		const endIndex = url.indexOf("?") > -1 ? url.indexOf("?") : url.length;
		const endChar = url.charAt(endIndex - 1);
		return endChar !== "/" ? [url.slice(0, endIndex), "/", url.slice(endIndex)].join("") : url;
	}

	/**
	 * Parses the body and returns it
	 * @returns {Promise<Object | null>}
	 */
	async json () {
		let result;
		try {
			result = await this._request.json();
		} catch (e) {
			result = null;
		}

		return result;
	}

	/**
	 * Parses the body and returns it
	 * @returns {Promise<Blob | null>}
	 */
	async blob () {
		let result;
		try {
			result = await this._request.blob()
		} catch (e) {
			result = null;
		}

		return result;
	}

	/**
	 * Parses the body and returns it
	 * @returns {Promise<FormData | null>}
	 */
	async formData () {
		let result;
		try {
			result = await this._request.formData();
		} catch (e) {
			result = null;
		}

		return result;
	}

	/**
	 * Turns request body into string / text
	 * @returns {Promise<string | null>}
	 */
	async text () {
		let result;
		try {
			result = await this._request.text();
		} catch (e) {
			result = null;
		}

		return result;
	}

	/**
	 * Turns request body into an ArrayBuffer
	 * @returns {Promise<ArrayBuffer>}
	 */
	async arrayBuffer () {
		let result;
		try {
			result = await this._request.arrayBuffer();
		} catch (e) {
			result = null;
		}

		return result;
	}
}


module.exports = Request;
