---
title: "SvelteKit on Cloudflare"
description: "Learn how to instrument your SvelteKit app on Cloudflare Workers and Pages and capture your first errors with Sentry."
url: https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit/
---

<!-- @format -->

# SvelteKit on Cloudflare | Sentry for Cloudflare

> The DSN for Web is "https://828cc2e3841ed14340517bd46881cd09@o4511052391186432.ingest.de.sentry.io/4511052435947600". Figure out whether this can be hardcoded or should be put in an ENV in cloudflare.

## [Prerequisites](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#prerequisites)

You need:

- A Sentry [account](https://sentry.io/signup/) and [project](https://docs.sentry.io/product/projects.md)
- Your application up and running
- SvelteKit version `2.0.0+` (we recommend `2.31.0` or higher for best support)
- Vite version `4.2` or newer

I'm on an older SvelteKit version than 2.31.0

Version `2.31.0` of SvelteKit introduces [official support for observability and tracing](https://svelte.dev/docs/kit/observability). This means that Sentry can now follow the official best practice for how the SDK should be set up:

- The Sentry SDK will be initialized at the correct, earliest possible time on the server, allowing for all its auto-instrumentation to work correctly. This means, you will now get spans from auto instrumentation (e.g. database queries) automatically.
- The Sentry SDK picks up spans emitted from SvelteKit directly. You'll get more accurate insights into the performance of your handlers, server actions, `load`, and remote functions.

SvelteKit observability is still an experimental feature in SvelteKit 2.x, but we recommend giving it a try. The Sentry wizard, as well as this guide, will use it as the default way of setting up the SDK.

## [Step 1: Install](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#step-1-install)

Choose the features you want to configure, and this guide will show you how:

Error Monitoring\[ ]Logs\[ ]Session Replay\[ ]Tracing\[ ]User Feedback

Want to learn more about these features?

- [**Issues**](https://docs.sentry.io/product/issues.md) (always enabled): Sentry's core error monitoring product that automatically reports errors, uncaught exceptions, and unhandled rejections. If you have something that looks like an exception, Sentry can capture it.
- [**Tracing**](https://docs.sentry.io/product/tracing.md): Track software performance while seeing the impact of errors across multiple systems. For example, distributed tracing allows you to follow a request from the frontend to the backend and back.
- [**Session Replay**](https://docs.sentry.io/product/explore/session-replay/web.md): Get to the root cause of an issue faster by viewing a video-like reproduction of what was happening in the user's browser before, during, and after the problem.
- [**Logs**](https://docs.sentry.io/product/explore/logs.md): Centralize and analyze your application logs to correlate them with errors and performance issues. Search, filter, and visualize log data to understand what's happening in your applications.

### [Install the Sentry SDK](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#install-the-sentry-sdk)

Run the command for your preferred package manager to add the Sentry SDK to your application:

```bash
npm install @sentry/sveltekit --save
```

If you're updating your Sentry SDK to the latest version, check out our [migration guide](https://github.com/getsentry/sentry-javascript/blob/master/MIGRATION.md) to learn more about breaking changes.

## [Step 2: Configure](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#step-2-configure)

You need to initialize and configure the Sentry SDK in three places: the client side, the server side, and your Vite config.

### [Configure Client-Side Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#configure-client-side-sentry)

Create a client hooks file `src/hooks.client.(js|ts)` in your project if you don't have one already. In this file, import and initialize the Sentry SDK and add the `handleErrorWithSentry` function to the [`handleError` hook](https://svelte.dev/docs/kit/hooks#Shared-hooks-handleError).

`src/hooks.client.(js|ts)`

```javascript
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: "___PUBLIC_DSN___",

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  // ___PRODUCT_OPTION_START___ performance

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
  // ___PRODUCT_OPTION_END___ performance
  integrations: [
    // ___PRODUCT_OPTION_START___ session-replay
    Sentry.replayIntegration(),
    // ___PRODUCT_OPTION_END___ session-replay
    // ___PRODUCT_OPTION_START___ user-feedback
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
    // ___PRODUCT_OPTION_END___ user-feedback
  ],

  // ___PRODUCT_OPTION_START___ session-replay
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // ___PRODUCT_OPTION_END___ session-replay
  // ___PRODUCT_OPTION_START___ logs

  // Enable logs to be sent to Sentry
  enableLogs: true,
  // ___PRODUCT_OPTION_END___ logs
});

const myErrorHandler = ({ error, event }) => {
  console.error("An error occurred on the client side:", error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);

// or alternatively, if you don't have a custom error handler:
// export const handleError = handleErrorWithSentry();
```

### [Configure Server-Side Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#configure-server-side-sentry)

_Requires SvelteKit `2.31.0` or higher and `@sentry/sveltekit` `10.8.0` or higher._

Configure server-side instrumentation and tracing in your `svelte.config.js` file:

`svelte.config.js`

```js
const config = {
  kit: {
    experimental: {
      instrumentation: {
        server: true,
      },
      // ___PRODUCT_OPTION_START___ performance
      tracing: {
        server: true,
      },
      // ___PRODUCT_OPTION_END___ performance
    },
  },
};

export default config;
```

Create a server hooks file `src/hooks.server.(js|ts)` in your project if you don't have one already. In this file, import and initialize the Sentry SDK and add the `handleErrorWithSentry` function to the [`handleError` hook](https://svelte.dev/docs/kit/hooks#Shared-hooks-handleError) and Sentry's Cloudflare request handler to the [`handle` hook](https://kit.svelte.dev/docs/hooks#server-hooks-handle).

`src/hooks.server.(js|ts)`

```javascript
import {
  handleErrorWithSentry,
  sentryHandle,
  initCloudflareSentryHandle,
} from "@sentry/sveltekit";
import { sequence } from "@sveltejs/kit/hooks";
import * as Sentry from "@sentry/sveltekit";

export const handle = sequence(
  initCloudflareSentryHandle({
    dsn: "___PUBLIC_DSN___",

    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    // ___PRODUCT_OPTION_START___ performance

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
    tracesSampleRate: 1.0,
    // ___PRODUCT_OPTION_END___ performance
    // ___PRODUCT_OPTION_START___ logs

    // Enable logs to be sent to Sentry
    enableLogs: true,
    // ___PRODUCT_OPTION_END___ logs
  }),
  sentryHandle(),
);

const myErrorHandler = ({ error, event }) => {
  console.error("An error occurred on the server side:", error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
// or alternatively, if you don't have a custom error handler:
// export const handleError = handleErrorWithSentry();
```

### [Configure Vite](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#configure-vite)

Add the `sentrySvelteKit` plugin **before** `sveltekit` in your `vite.config.(js|ts)` file to automatically upload source maps to Sentry and instrument `load` functions for tracing if it's configured.

`vite.config.(js|ts)`

```javascript
import { sveltekit } from "@sveltejs/kit/vite";

import { sentrySvelteKit } from "@sentry/sveltekit";

import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sentrySvelteKit(), sveltekit()],

  // ... rest of your Vite config
});
```

### [Configure Cloudflare for Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#configure-cloudflare-for-sentry)

Since the SDK needs access to the `AsyncLocalStorage` API, you need to set the `nodejs_compat` compatibility flag in your `wrangler.(jsonc|toml)` configuration file:

`wrangler.jsonc`

```jsonc
{
  "compatibility_flags": ["nodejs_compat"],
}
```

### [Release Configuration (Optional)](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#release-configuration-optional)

If you don't set the `release` option manually, the SDK automatically detects it from these sources (in order of priority):

1. The `SENTRY_RELEASE` environment variable
2. The `CF_VERSION_METADATA.id` binding (if configured)

To enable automatic release detection via Cloudflare's version metadata, add the `CF_VERSION_METADATA` binding in your wrangler configuration. This provides access to the [Cloudflare version metadata](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/):

Using an SDK version before 10.35.0?

In earlier versions, you need to manually extract `CF_VERSION_METADATA.id` and pass it as the `release` option:

```javascript
Sentry.withSentry(
  (env) => ({
    dsn: "___PUBLIC_DSN___",
    release: env.CF_VERSION_METADATA?.id,
  }),
  // ...
);
```

`wrangler.jsonc`

```jsonc
{
  // ...
  "version_metadata": {
    "binding": "CF_VERSION_METADATA",
  },
}
```

## [Step 3: Add Readable Stack Traces With Source Maps (Optional)](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#step-3-add-readable-stack-traces-with-source-maps-optional)

To upload source maps for clear error stack traces, add your Sentry auth token, organization, and project slug in your `vite.config.(js|ts)` file:

`vite.config.(js|ts)`

```javascript
import { sveltekit } from "@sveltejs/kit/vite";
import { sentrySvelteKit } from "@sentry/sveltekit";

export default {
  plugins: [
    sentrySvelteKit({
      org: "___ORG_SLUG___",
      project: "___PROJECT_SLUG___",
      // store your auth token in an environment variable
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    sveltekit(),
  ],

  // ... rest of your Vite config
};
```

To keep your auth token secure, always store it in an environment variable instead of directly in your files:

`.env`

```bash
SENTRY_AUTH_TOKEN=___ORG_AUTH_TOKEN___
```

## [Step 4: Verify Your Setup](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#step-4-verify-your-setup)

Let's test your setup and confirm that Sentry is working correctly and sending data to your Sentry project.

### [Issues](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#issues)

To verify that Sentry captures errors and creates issues in your Sentry project, create a test page, for example, at `src/routes/sentry-example/+page.svelte` with a button that throws an error when clicked:

`+page.svelte`

```html
<script>
  function throwTestError() {
    throw new Error("Sentry Example Frontend Error");
  }
</script>

<button
  type="button"
  onclick="
    {
      throwTestError;
    }
  ">
  Throw error
</button>
```

Open the page `sentry-example` in a browser and click the button to trigger a frontend error.

##### Important

Errors triggered from within your browser's developer tools (like the browser console) are sandboxed, so they will not trigger Sentry's error monitoring.

### [Tracing](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#tracing)

To test tracing, create a test API route like `src/routes/sentry-example/+server.(js|ts)`:

`+server.(js|ts)`

```javascript
export const GET = async () => {
  throw new Error("Sentry Example API Route Error");
};
```

Next, update your test button to call this route and throw an error if the response isn't `ok`:

`+page.svelte`

```html
<script>
  import * as Sentry from "@sentry/sveltekit";

  function throwTestError() {
    Sentry.startSpan(
      {
        name: "Example Frontend Span",
        op: "test",
      },
      async () => {
        const res = await fetch("/sentry-example");
        if (!res.ok) {
          throw new Error("Sentry Example Frontend Error");
        }
      },
    );
  }
</script>

<button
  type="button"
  onclick="
    {
      throwTestError;
    }
  ">
  Throw error with trace
</button>
```

Open the page `sentry-example` in a browser and click the button to trigger two errors:

- a frontend error
- an error within the API route

Additionally, this starts a trace to measure the time it takes for the API request to complete.

### [Logs NEW](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#logs-)

To verify that Sentry catches your logs, add some log statements to your application:

```javascript
Sentry.logger.info("User example action completed");

Sentry.logger.warn("Slow operation detected", {
  operation: "data_fetch",
  duration: 3500,
});

Sentry.logger.error("Validation failed", {
  field: "email",
  reason: "Invalid email",
});
```

### [View Captured Data in Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#view-captured-data-in-sentry)

Now, head over to your project on [Sentry.io](https://sentry.io) to view the collected data (it takes a couple of moments for the data to appear).

Need help locating the captured errors in your Sentry project?

1. Open the [**Issues**](https://sentry.io/issues) page and select an error from the issues list to view the full details and context of this error. For more details, see this [interactive walkthrough](https://docs.sentry.io/product/sentry-basics/integrate-frontend/generate-first-error.md#ui-walkthrough).
2. Open the [**Traces**](https://sentry.io/explore/traces) page and select a trace to reveal more information about each span, its duration, and any errors. For an interactive UI walkthrough, click [here](https://docs.sentry.io/product/sentry-basics/distributed-tracing/generate-first-error.md#ui-walkthrough).
3. Open the [**Logs**](https://sentry.io/explore/logs) page and filter by service, environment, or search keywords to view log entries from your application. For an interactive UI walkthrough, click [here](https://docs.sentry.io/product/explore/logs.md#overview).

## [Next Steps](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/sveltekit.md#next-steps)

At this point, you should have integrated Sentry into your SvelteKit application and should already be sending data to your Sentry project.

Now's a good time to customize your setup and look into more advanced topics. Our next recommended steps for you are:

- Explore [practical guides](https://docs.sentry.io/guides.md) on what to monitor, log, track, and investigate after setup
- Learn how to [manually capture errors](https://docs.sentry.io/platforms/javascript/guides/cloudflare/usage.md)
- Continue to [customize your configuration](https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration.md)
- Get familiar with [Sentry's product features](https://docs.sentry.io/product.md) like tracing, insights, and alerts
- Learn how to [manually instrument](https://docs.sentry.io/platforms/javascript/guides/sveltekit/apis.md#load-function-instrumentation) SvelteKit-specific features

Are you having problems setting up the SDK?

- Find various support topics in [Cloudflare troubleshooting](https://docs.sentry.io/platforms/javascript/guides/cloudflare/troubleshooting.md) and [SvelteKit troubleshooting](https://docs.sentry.io/platforms/javascript/guides/sveltekit/troubleshooting.md)
- [Get support](https://sentry.zendesk.com/hc/en-us/)
