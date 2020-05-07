"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cookie_1 = tslib_1.__importDefault(require("cookie"));
const querystring_1 = tslib_1.__importDefault(require("querystring"));
class RouterRequest {
    constructor(request, options) {
        this.options = options;
        this.rawRequest = request;
        this.url = this.fixUrl(request.url);
        this.urlData = new URL(this.url);
        this.path = this.urlData.pathname;
        this.query = querystring_1.default.parse(this.urlData.search.slice(1));
        this.method = (request.method || "get").toLowerCase();
        this.body = request.body;
        this.bodyUsed = request.bodyUsed;
        this.headers = {};
        this.cookies = {};
        this.params = {};
        this.fetchValues(request);
    }
    fetch() {
        return fetch(this.rawRequest);
    }
    json() {
        return this.rawRequest.json()
            .catch(() => null);
    }
    blob() {
        return this.rawRequest.blob()
            .catch(() => null);
    }
    formData() {
        return this.rawRequest.formData()
            .catch(() => null);
    }
    text() {
        return this.rawRequest.text()
            .catch(() => null);
    }
    arrayBuffer() {
        return this.rawRequest.arrayBuffer()
            .catch(() => null);
    }
    fixUrl(url) {
        const endIndex = url.indexOf("?") > -1 ? url.indexOf("?") : url.length;
        const endChar = url.charAt(endIndex - 1);
        return endChar !== "/" ? [url.slice(0, endIndex), "/", url.slice(endIndex)].join("") : url;
    }
    fetchValues(request) {
        const allHeaders = [...request.headers];
        allHeaders.forEach(header => {
            const [name, value] = header;
            this.headers[name.toLowerCase()] = value;
        });
        this.cookies = cookie_1.default.parse(this.headers.cookie || "");
    }
}
exports.default = RouterRequest;
