import cookie from "cookie";
import RouterRequest from "./Request";


export declare type bodyType = string | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array> | null | undefined;
export declare type FormatResponse = [
    Response,
    Array<Promise<unknown>>
];

export default class RouterResponse {
    public request: RouterRequest;
    public finalized: boolean;
    public custom: Response | undefined | null;
    public response: {
        statusCode: number;
        status: string;
        headers: { [key: string]: string };
        cookies: { [key: string]: { value: string; options?: { [key: string]: unknown } } };
        tasks: Array<Promise<unknown>>;
        responseType: string;
        body: bodyType;
        redirect: null | {
            url: string;
            statusCode: number;
        };
    };

    constructor (request: RouterRequest) {
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

    json (data: unknown): this {
        this.response.body = JSON.stringify(data);
        this.response.responseType = "application/json";
        return this;
    }

    raw (body: bodyType, type: string): this {
        this.response.body = body;
        this.response.responseType = type;
        return this;
    }

    text (text: string): this {
        this.response.body = text;
        this.response.responseType = "text/plain";
        return this;
    }

    status (status: string): this {
        this.response.status = status;
        return this;
    }

    statusCode (code: number): this {
        this.response.statusCode = code;
        return this;
    }

    tasks (tasks: Array<Promise<unknown>>): this {
        this.response.tasks = [...this.response.tasks, ...tasks];
        return this;
    }

    setHeader (name: string, value: string): this {
        this.response.headers[name] = value;
        return this;
    }

    setCookie (name: string, value: string, options: { [key: string]: unknown } = {}): this {
        this.response.cookies[name] = {
            value,
            options
        };
        return this;
    }

    end (): this {
        this.finalized = true;
        return this;
    }

    redirect (url: string, statusCode = 302) {
        this.response.redirect = {
            url,
            statusCode
        };
        return this;
    }

    setResponse (response: Response): this {
        this.custom = response;
        return this;
    }

    public format (): FormatResponse {
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
                        const value = cookies[i].value,
                            cookieOptions = cookies[i].options;
                        const newCookie = cookie.serialize(i, value, cookieOptions || {});
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
        } else {
            return [
                Response.redirect(this.response.redirect.url, this.response.redirect.statusCode || 302),
                this.response.tasks || []
            ];
        }
    }
}
