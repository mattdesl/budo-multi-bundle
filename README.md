# budo-multi-bundle

A complete example of an advanced [budo](https://github.com/mattdesl/budo) script for development & build that handles:

- Multiple input and output bundles (using factor-bundle)
- Optional compression with [Terser](https://www.npmjs.com/package/terser)
- Super-fast ES6 to ES5 with [SWC](https://github.com/swc-project/swc)
- A visual directory listing when you hit the root `/` index, allowing you to choose which HTML to open

This project includes three scripts:

- `npm run start` (or `npm start`) — runs the LiveReload development server

- `npm run bundle` — bundles your input files into the static `public/` folder

- `npm run serve` — runs a bare-bones HTTP server for testing the built files locally.

  - <em>(you probably shouldn't run this in a production AWS environment)</em>

All of the meat is in the [./tools/bundler.js](./tools/bundler.js) script.

###### :bulb: This branch uses SWC for ES6-to-ES5 transpiling — see the [`babelify` branch](https://github.com/mattdesl/budo-multi-bundle/tree/babelify) for an alternative approach using Babel.

## Gotchas

Budo has a special feature that suspends the server's response until browserify has fully completed writing its bundle, but this only works on the `common.js` file.

So there is a chance with this multi-bundle setup that you will hit "stale" bundles occasionally. This can happen if the browser page reloads before the split bundles had a chance to be fully written to the disk.

You can try to solve this by increasing the `config.delay` option in the bundle script.

## Bringing this Into Your Own Project

If you don't want to clone this repo, you can:

- Add a [.swcrc](./.swcrc) file to your project directory (if you plan to use SWC — however you can just strip that from the build or replace it with your favourite Babel, Buble, etc)

- Copy the [bundler.js](./bundler.js) script and [package.json "script" fields](./package.json) into your project

- Run the following to install dev dependencies:
  ```sh
  npm install --save-dev budo factor-bundle serve-index terser browserify concat-stream swcify @swc/core
  ```

## Why Not Webpack, Parcel, etc?

Because I prefer programmable workflows to configuration files.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo-multi-bundle/blob/master/LICENSE.md) for details.
