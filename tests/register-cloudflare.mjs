import { registerHooks } from "node:module";

const moduleSource = `
export const env = new Proxy({}, {
  get(_target, property) {
    return globalThis.__AIALRA_TEST_CLOUDFLARE_ENV__?.[property];
  }
});
`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") {
      return {
        url: `data:text/javascript,${encodeURIComponent(moduleSource)}`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});
