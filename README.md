<h1 align="center">@jawilx/gen-api</h1>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

<p align="center">A modern cli tool that auto generate typescript api code from swagger 2 and openapi 3</p>

<pre align="center">pnpm i -D @jawilx/gen-api</pre>

## Usage

1. update package.json
```json
{
  // ...
  "scripts": {
    // ...
    "genapi:init": "gen-api init",
    "genapi": "gen-api now"
  }
}
```

2. init api.config.ts
<pre align="center">pnpm genapi:init</pre>

3. set api.config.ts apiList swaggerUrl ([How to get swaggerUrl](https://apifox.com/help/api-docs/importing-api/swagger#url-%E5%AF%BC%E5%85%A5))

4. generate
<pre align="center">pnpm genapi</pre>

## License

[MIT](./LICENSE) License © 2023-PRESENT [JawilX](https://github.com/JawilX)


<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@jawilx/gen-api?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@jawilx/gen-api
[npm-downloads-src]: https://img.shields.io/npm/dm/@jawilx/gen-api?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@jawilx/gen-api
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@jawilx/gen-api?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@jawilx/gen-api
[license-src]: https://img.shields.io/github/license/jawilx/gen-api.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/jawilx/gen-api/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/@jawilx/gen-api
