export declare type IncomingEvent = {
    type: "fetch";
    request: EventRequest;
    passThroughOnException: () => void;
    respondWith: (callback: Promise<unknown> | unknown) => void;
    waitUntil: (tasks: Promise<unknown>) => void;
};
export declare type EventRequest = {
    url: string;
    method: string;
    body: ReadableStream;
    bodyUsed: boolean;
    redirect: "follow" | "manual";
    cf: {
        asn: string;
        colo: string;
        weight: unknown;
        exclusive: number;
        group: unknown;
        ["group-weight"]: unknown;
        tlsCipher: string;
        country: string;
        tlsClientAUth: unknown;
        tlsVersion: string;
        cacheEverything: boolean;
        scrapeShield: boolean;
        polish: "lossy" | "lossless" | "off";
        minify: {
            javascript: boolean;
            css: boolean;
            html: boolean;
        };
        mirage: boolean;
        apps: boolean;
        cacheTtl: number;
        resolveOverride: string;
    };
    clone: () => EventRequest;
    headers: Headers;
    json: () => Promise<{
        [key: string]: unknown;
    } | null>;
    fetch: () => Promise<Response>;
    blob: () => Promise<Blob | null>;
    formData: () => Promise<FormData | null>;
    text: () => Promise<string | null>;
    arrayBuffer: () => Promise<ArrayBuffer | null>;
};
