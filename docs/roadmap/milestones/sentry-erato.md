---
title: "Hono on Cloudflare"
description: "Learn how to instrument your Hono app on Cloudflare Workers and capture your first errors with Sentry."
url: https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono/
---

<!-- @format -->

# Hono on Cloudflare | Sentry for Cloudflare

> The DSN for Erato is "https://065c9002a41d814ecde22df9fc96b090@o4511052391186432.ingest.de.sentry.io/4511052396888144". Figure out whether this can be hardcoded or should be put in an ENV in cloudflare.

##### Community Middleware Deprecation

The community-maintained `@hono/sentry` middleware that uses `toucan-js` has been deprecated in favor of using `@sentry/cloudflare` directly. If you're currently using the `@hono/sentry` middleware with `toucan-js`, you should migrate to `@sentry/cloudflare` directly as shown in this guide.

## [Step 1: Install](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#step-1-install)

Choose the features you want to configure, and this guide will show you how:

Error Monitoring\[ ]Logs\[ ]Tracing

Want to learn more about these features?

- [**Issues**](https://docs.sentry.io/product/issues.md) (always enabled): Sentry's core error monitoring product that automatically reports errors, uncaught exceptions, and unhandled rejections. If you have something that looks like an exception, Sentry can capture it.
- [**Tracing**](https://docs.sentry.io/product/tracing.md): Track software performance while seeing the impact of errors across multiple systems. For example, distributed tracing allows you to follow a request from the frontend to the backend and back.
- [**Logs**](https://docs.sentry.io/product/explore/logs.md): Centralize and analyze your application logs to correlate them with errors and performance issues. Search, filter, and visualize log data to understand what's happening in your applications.

### [Install the Sentry SDK](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#install-the-sentry-sdk)

Run the command for your preferred package manager to add the Sentry SDK to your application:

```bash
npm install @sentry/cloudflare --save
```

## [Step 2: Configure](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#step-2-configure)

The main Sentry configuration should happen as early as possible in your app's lifecycle.

### [Wrangler Configuration](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#wrangler-configuration)

Since the SDK needs access to the `AsyncLocalStorage` API, you need to set the `nodejs_compat` compatibility flag in your `wrangler.(jsonc|toml)` configuration file:

`wrangler.jsonc`

```jsonc
{
  "compatibility_flags": ["nodejs_compat"],
}
```

### [Release Configuration (Optional)](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#release-configuration-optional)

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

### [Initialize the Sentry SDK](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#initialize-the-sentry-sdk)

Wrap your Hono app with the `withSentry` function, for example, in your `index.ts` file, to initialize the Sentry SDK and hook into the environment:

`index.ts`

```typescript
import { Env, Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";

const app = new Hono();

// Add your routes here
// app.get('/your-route', (c) => c.text('Hello!'));

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: "___PUBLIC_DSN___",

    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    // ___PRODUCT_OPTION_START___ logs

    // Enable logs to be sent to Sentry
    enableLogs: true,
    // ___PRODUCT_OPTION_END___ logs
    // ___PRODUCT_OPTION_START___ performance

    // Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#tracesSampleRate
    tracesSampleRate: 1.0,
    // ___PRODUCT_OPTION_END___ performance
  }),
  app,
);
```

### [Migration from Community Middleware](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#migration-from-community-middleware)

If you're currently using the `@hono/sentry` middleware, migrate to the official `@sentry/cloudflare` middleware:

```javascript
// New approach using official Sentry SDK
import { Hono } from 'hono';
import * as Sentry from '@sentry/cloudflare';

const app = new Hono();

// Wrap your app with Sentry
export default Sentry.withSentry(
  (env: Env) => ({
    dsn: '___PUBLIC_DSN___',
    tracesSampleRate: 1.0,
  }),
  app
);
```

### [Report Unhandled Exceptions](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#report-unhandled-exceptions)

By default, Sentry reports exceptions reported by the `onError` function from Hono. In case the error comes with a status code, it captures all errors except for the ones with a 3xx or 4xx status code.

To learn how to customize this behavior, see the [`honoIntegration` documentation](https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/integrations/hono.md).

## [Step 3: Add Readable Stack Traces With Source Maps (Optional)](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#step-3-add-readable-stack-traces-with-source-maps-optional)

The stack traces in your Sentry errors probably won't look like your actual code. To fix this, upload your source maps to Sentry. The easiest way to do this is by using the Sentry Wizard:

```bash
npx @sentry/wizard@latest -i sourcemaps
```

## [Step 4: Verify Your Setup](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#step-4-verify-your-setup)

### [Issues](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#issues)

First, let's verify that Sentry captures errors and creates issues in your Sentry project. Add the following code snippet to your main application file, adding a route that triggers an error that Sentry will capture:

```javascript
app.get("/debug-sentry", () => {
  throw new Error("My first Sentry error!");
});
```

### [Tracing](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#tracing)

To test your tracing configuration, update the previous code snippet by starting a trace to measure the time it takes for the execution of your code:

```javascript
app.get("/debug-sentry", async () => {
  await Sentry.startSpan(
    {
      op: "test",
      name: "My First Test Transaction",
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 100ms
      throw new Error("My first Sentry error!");
    },
  );
});
```

### [Logs NEW](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#logs-)

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

## [Next Steps](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/hono.md#next-steps)

At this point, you should have integrated Sentry and should already be sending data to your Sentry project.

Now's a good time to customize your setup and look into more advanced topics. Our next recommended steps for you are:

- Learn how to [manually capture errors](https://docs.sentry.io/platforms/javascript/guides/cloudflare/usage.md)
- Continue to [customize your configuration](https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration.md)
- Make use of [Cloudflare-specific features](https://docs.sentry.io/platforms/javascript/guides/cloudflare/features.md)
- Get familiar with [Sentry's product features](https://docs.sentry.io/product.md) like tracing, insights, and alerts

Are you having problems setting up the SDK?

- Check out setup instructions for other popular [frameworks on Cloudflare](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks.md)
- Find various support topics in [troubleshooting](https://docs.sentry.io/platforms/javascript/guides/cloudflare/troubleshooting.md)
- [Get support](https://sentry.zendesk.com/hc/en-us/)
