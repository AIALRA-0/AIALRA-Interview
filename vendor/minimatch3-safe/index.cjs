"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const upstream = require("minimatch-upstream");

function minimatch(path, pattern, options) {
  return upstream.minimatch(path, pattern, options);
}

for (const [name, value] of Object.entries(upstream)) {
  minimatch[name] = value;
}

module.exports = minimatch;
