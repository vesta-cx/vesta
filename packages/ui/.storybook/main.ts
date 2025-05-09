import type { StorybookConfig } from '@storybook/sveltekit';

import { join, dirname } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|ts|svelte)"
  ],

  "addons": [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-svelte-csf'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath("@storybook/experimental-addon-test"),
    getAbsolutePath("@storybook/experimental-addon-test"),
    getAbsolutePath("@storybook/addon-mdx-gfm"),
    "@chromatic-com/storybook"
  ],

  "framework": {
    "name": '@storybook/sveltekit',
    "options": {}
  },

  docs: {
    autodocs: true
  }
};
export default config;