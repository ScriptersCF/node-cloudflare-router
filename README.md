## cf-router
A simple module for easily processing incoming requests to Cloudflare Workers.

----

This module is super-easy to use, and it's plug-and-play. Literally. All you have to do to start
is to tell the module when you want to process a request, and it will handle everything for you.

In order to tell the module when it should process a request (or more specifically ,telling the *router*):
```JavaScript
const Router = require("cf-router");
const router = new Router();

router.get("/", (req, res) => {
    res.text("Welcome!");
});

router.responseHandler = (response, tasks, request) => {
    return response;
};

// Listening for incoming requests
addEventListener("fetch", event => {
    return event.respondWith((async () => {
        // Give the router the request object
        return router.serve(event.request);
    })());
});

```

## Full code example
```JavaScript
const Router = require("cf-router");
const router = new Router(),
	admin = new Router(),
	api = new Router(),
	apiV1 = new Router();

router.get("/", (req, res) => {
	res.text("Welcome!");
});

admin.get("/:user", (req, res) => {
	res.text(`Welcome ${req.params.user} to the admin panel!`);
});

api.get("/", (req, res) => {
	res.text("API operational");
});

apiV1.get("/", (req, res) => {
	res.text("API v1 is operational")
		.code(200) // Status code
		.status("Hello world") // Status text
		.setHeader("name", "value") // Set header
		.setCookie("key", "value") // Set cookie, 3rd argument is options
		.json({ hello: "world" }) // Responds with JSON
		.tasks([]) // Tasks for async processing after response
		.raw("body", "type") // Body is anything, type is content-type
		.end();
});

// Connecting
router.use("/admin", admin);
router.use("/api", api);
api.use("/v1", apiV1);

router.responseHandler = (response, tasks, request) => {
	// response is the response data
	// tasks is the tasks that can be processed after the response (event.waitUntil)
	// request is the request data
	return response;
};

router.errorHandler = (error, response, request) => {
	console.log(error);
};


addEventListener("fetch", event => {
	return event.respondWith((async () => {
		return router.serve(event.request);
	})());
});

```
