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
		this.headers = {};
		this.cookies = {};

		this._fetchValues(request);
	}

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

	_fixUrl (url) {
		const endIndex = url.indexOf("?") > -1 ? url.indexOf("?") : url.length;
		const endChar = url.charAt(endIndex - 1);
		return endChar !== "/" ? [url.slice(0, endIndex), "/", url.slice(endIndex)].join("") : url;
	}

	async json () {
		let result;
		try {
			result = await this._request.json();
		} catch (e) {
			result = null;
		}

		return result;
	}

	async blob () {
		let result;
		try {
			result = await this._request.blob()
		} catch (e) {
			result = null;
		}

		return result;
	}

	async formData () {
		let result;
		try {
			result = await this._request.formData();
		} catch (e) {
			result = null;
		}

		return result;
	}

	async text () {
		let result;
		try {
			result = await this._request.text();
		} catch (e) {
			result = null;
		}

		return result;
	}

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
