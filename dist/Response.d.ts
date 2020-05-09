import RouterRequest from "./Request";
export declare type bodyType = string | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array> | null | undefined;
export declare type FormatResponse = [Response, Array<Promise<unknown>>];
export default class RouterResponse {
    request: RouterRequest;
    finalized: boolean;
    custom: Response | undefined | null;
    response: {
        statusCode: number;
        status: string;
        headers: {
            [key: string]: string;
        };
        cookies: {
            [key: string]: {
                value: string;
                options?: {
                    [key: string]: unknown;
                };
            };
        };
        tasks: Array<Promise<unknown>>;
        responseType: string;
        body: bodyType;
        redirect: null | {
            url: string;
            statusCode: number;
        };
    };
    [key: string]: unknown;
    constructor(request: RouterRequest);
    json(data: unknown): this;
    raw(body: bodyType, type: string): this;
    text(text: string): this;
    status(status: string): this;
    statusCode(code: number): this;
    tasks(tasks: Array<Promise<unknown>>): this;
    setHeader(name: string, value: string): this;
    setCookie(name: string, value: string, options?: {
        [key: string]: unknown;
    }): this;
    end(): this;
    redirect(url: string, statusCode?: number): this;
    setResponse(response: Response): this;
    format(): FormatResponse;
}
