import cookie from "cookie";
import qs from "querystring";
import { EventRequest } from "./Interfaces";


export default class RouterRequest {
    public options: unknown;
    public rawRequest: EventRequest;
    public url: string;
    public urlData: URL;
    public path: string;
    public query: qs.ParsedUrlQuery;
    public method: string;
    public body?: unknown;
    public params: { [key: string]: string };
    public bodyUsed: boolean;
    public headers: { [key: string]: string };
    public cookies: { [key: string]: string };
    [key: string]: unknown;

    constructor (request: EventRequest, options?: unknown) {
        this.options = options;
        this.rawRequest = request;
        this.url = this.fixUrl(request.url);
        this.urlData = new URL(this.url);
        this.path = this.urlData.pathname;
        this.query = qs.parse(this.urlData.search.slice(1));
        this.method = (request.method || "get").toLowerCase();
        this.body = request.body;
        this.bodyUsed = request.bodyUsed;
        this.headers = {};
        this.cookies = {};
        this.params = {};

        this.fetchValues(request);
    }

    public fetch (): Promise<Response> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        return fetch(this.rawRequest);
    }

    public json (): Promise<{ [key: string]: unknown } | null> {
        return this.rawRequest.json()
            .catch(() => null);
    }

    public blob (): Promise<Blob | null> {
        return this.rawRequest.blob()
            .catch(() => null);
    }

    public formData (): Promise<FormData | null> {
        return this.rawRequest.formData()
            .catch(() => null);
    }

    public text (): Promise<string | null> {
        return this.rawRequest.text()
            .catch(() => null);
    }

    public arrayBuffer (): Promise<ArrayBuffer | null> {
        return this.rawRequest.arrayBuffer()
            .catch(() => null);
    }

    private fixUrl (url: string): string {
        const endIndex = url.indexOf("?") > -1 ? url.indexOf("?") : url.length;
        const endChar = url.charAt(endIndex - 1);
        return endChar !== "/" ? [url.slice(0, endIndex), "/", url.slice(endIndex)].join("") : url;
    }

    private fetchValues (request: EventRequest): void {
        const allHeaders = [...request.headers];
        allHeaders.forEach(header => {
            const [name, value] = header;
            this.headers[name.toLowerCase()] = value;
        });

        this.cookies = cookie.parse(this.headers.cookie || "");
    }
}
