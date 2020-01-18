const cookie = require("cookie");
const contentTypes = {};


class RequestResponse {
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

	json (data) {
		this.response.body = JSON.stringify(data);
		this.response.responseType = "application/json";
		return this;
	}

	raw (body, type) {
		this.response.body = body;
		this.response.responseType = type;
		return this;
	}

	status (text) {
		this.response.status = text;
		return this;
	}

	text (text) {
		this.response.body = text;
		this.response.type = "text/plain";
		return this;
	}

	code (code) {
		this.response.code = code;
		return this;
	}

	tasks (tasks) {
		this.response.tasks = tasks;
		return this;
	}

	setHeader (key, value) {
		this.response.headers[key] = value;
		return this;
	}

	setCookie (key, value, options = {}) {
		this.response.cookies[key] = {
			value,
			options
		};
		return this;
	}

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

	redirect (url, status) {
		this.response.redirect = {
			url,
			status
		};
	}

	_format () {
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

module.exports = RequestResponse;
