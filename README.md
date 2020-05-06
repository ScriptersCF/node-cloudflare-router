## cf-router
A simple module for easily processing incoming requests to Cloudflare Workers.

----
<a href="https://npmjs.com/package/bloxy"><img src="https://img.shields.io/npm/v/cf-router.svg?maxAge=3600&style=flat-square" alt="NPM"></a>
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/97059473b41c44238c5698963065f47a)](https://www.codacy.com/manual/Visualizememe1/node-cf-router?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Visualizememe/node-cf-router&amp;utm_campaign=Badge_Grade)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FVisualizememe%2Fnode-cf-router.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FVisualizememe%2Fnode-cf-router?ref=badge_shield)

This module is super-easy to use, and it's plug-and-play. Literally. All you have to do to start
is to tell the module when you want to process a request, and it will handle everything for you.

In order to tell the module when it should process a request (or more specifically ,telling the *router*):
```JavaScript
const { Router } = require("cf-router");
const router = new Router();
const apiRouter = new Router();

// Connecting routers
router.use("/api", apiRouter);

// Setting up paths
router.get("/", (req, res) => res.text("Hello, world!"));
apiRouter.get("/", (req, res) => res.text("Welcome to the API!"));
apiRouter.get("/welcome/:name", (req, res) => res.text(`Welcome, ${req.params.name}`));

// Listening for requests
addEventListener("fetch", event => {
    event.respondWith(router.serve(event.request));
});

```


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FVisualizememe%2Fnode-cf-router.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FVisualizememe%2Fnode-cf-router?ref=badge_large)
