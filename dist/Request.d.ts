/// <reference types="node" />
import qs from "querystring";
import { EventRequest } from "./Interfaces";
export default class RouterRequest {
    options: unknown;
    rawRequest: EventRequest;
    url: string;
    urlData: URL;
    path: string;
    query: qs.ParsedUrlQuery;
    method: string;
    body?: unknown;
    params: {
        [key: string]: string;
    };
    bodyUsed: boolean;
    headers: {
        [key: string]: string;
    };
    cookies: {
        [key: string]: string;
    };
    constructor(request: EventRequest, options?: unknown);
    fetch(): Promise<Response>;
    json(): Promise<{
        [key: string]: unknown;
    } | null>;
    blob(): Promise<Blob | null>;
    formData(): Promise<FormData | null>;
    text(): Promise<string | null>;
    arrayBuffer(): Promise<ArrayBuffer | null>;
    private fixUrl;
    private fetchValues;
}
