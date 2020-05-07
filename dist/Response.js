"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cookie_1 = tslib_1.__importDefault(require("cookie"));
class RouterResponse {
    constructor(request) {
        this.request = request;
        this.finalized = false;
        this.response = {
            statusCode: 200,
            status: "OK",
            headers: {},
            cookies: {},
            tasks: [],
            responseType: "text",
            body: null,
            redirect: null
        };
    }
    json(data) {
        this.response.body = JSON.stringify(data);
        this.response.responseType = "application/json";
        return this;
    }
    raw(body, type) {
        this.response.body = body;
        this.response.responseType = type;
        return this;
    }
    text(text) {
        this.response.body = text;
        this.response.responseType = "text/plain";
        return this;
    }
    status(status) {
        this.response.status = status;
        return this;
    }
    statusCode(code) {
        this.response.statusCode = code;
        return this;
    }
    tasks(tasks) {
        this.response.tasks = [...this.response.tasks, ...tasks];
        return this;
    }
    setHeader(name, value) {
        this.response.headers[name] = value;
        return this;
    }
    setCookie(name, value, options = {}) {
        this.response.cookies[name] = {
            value,
            options
        };
        return this;
    }
    end() {
        this.finalized = true;
        return this;
    }
    redirect(url, statusCode = 302) {
        this.response.redirect = {
            url,
            statusCode
        };
        return this;
    }
    setResponse(response) {
        this.custom = response;
        return this;
    }
    format() {
        if (this.custom) {
            return [
                this.custom,
                this.response.tasks || []
            ];
        }
        if (!this.response.redirect) {
            const options = {
                statusText: this.response.status || "OK",
                status: this.response.statusCode || 200,
                headers: this.response.headers || {}
            };
            const body = this.response.body;
            const cookies = this.response.cookies;
            if (cookies) {
                let totalCookies = "";
                Object.keys(cookies)
                    .forEach(i => {
                    const value = cookies[i].value, cookieOptions = cookies[i].options;
                    const newCookie = cookie_1.default.serialize(i, value, cookieOptions || {});
                    totalCookies += `${newCookie};`;
                });
                options.headers["Set-Cookie"] = totalCookies;
            }
            if (this.response.responseType) {
                options.headers["Content-Type"] = this.response.responseType;
            }
            const response = new Response(body, options);
            return [
                response,
                this.response.tasks || []
            ];
        }
        else {
            return [
                Response.redirect(this.response.redirect.url, this.response.redirect.statusCode || 302),
                this.response.tasks || []
            ];
        }
    }
}
exports.default = RouterResponse;
