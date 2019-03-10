const budo = require('budo');
const path = require('path');
const fs = require('fs');
const serveIndex = require('serve-index');
const Terser = require('terser');
const browserify = require('browserify');
const concat = require('concat-stream');

// Options for the build step
const config = {
  // Whether to compress results with Terser
  minify: false,
  // 'bundle', 'dev' or 'serve'
  mode: process.argv[2],
  // Directory to serve/build into
  dir: path.resolve(__dirname, '../public'),
  // Common bundle filename
  common: 'common.js',
  // Multiple bundles
  entries: [
    { input: 'src/one.js', output: 'bundle-1.js' },
    { input: 'src/two.js', output: 'bundle-2.js' }
  ],
  // Common browserify options across dev + bundle
  browserifyOptions: {
    transform: [
      'babelify'
    ]
  },
  // Delay in milliseconds between reloads, giving the
  // split files a better chance to be written to the disk before
  // we reload the page.
  delay: 50
};

// Entry filenames
const entries = config.entries.map(e => e.input);

// Map entries to full output paths
const outputs = config.entries.map(e => {
  return path.resolve(config.dir, e.output);
});

// This is optional (can be undefined/empty array)
// Just conveniently gives us a directory listing on '/'
const middleware = [
  serveIndex(config.dir, {
    filter: file => /\.(html?)$/i.test(file)
  })
];

// Dev server
function dev () {
  const app = budo(entries, {
    stream: process.stdout,
    // Directory of dev server
    dir: config.dir,
    // Tell browserify the src we will use in our <script> tag
    serve: config.common,
    // Any plugins/transforms/options
    browserify: {
      ...config.browserifyOptions,
      // Write outputs to each given file name
      plugin: [
        [ 'factor-bundle', { outputs } ]
      ]
    },
    middleware
  })
    // A note: we do not set budo { live: true }
    // because it uses an optimization (reload on pending)
    // that may cause subtle issues with the factor-bundle.
    // Instead we manually set up live reloading like so:
    .live()
    .watch()
    .on('update', () => {
      // Defer the reload slightly to give more time for the
      // split files to be written. This is a bit hackish.
      setTimeout(() => {
        app.reload();
      }, config.delay);
    })
    .on('watch', (type, file) => {
      if (/\.(html?|css)$/i.test(file)) {
        app.reload(file);
      }
    });
}

// Bundle step
function bundle () {
  // We have to use streams to compress the split bundles
  const outputStreams = outputs.map(f => writeStream(f));

  // Run browserify and write the final bundle
  browserify({
    ...config.browserifyOptions,
    entries,
    // Use factor bundle with streaming output
    plugin: [
      [ 'factor-bundle', { outputs: outputStreams } ]
    ]
  }).bundle((err, src) => {
    if (err) throw err;

    const code = compressIfNeeded(src.toString());
    const commonFilePath = path.resolve(config.dir, config.common);
    writeFile(commonFilePath, code, err => {
      if (err) throw err;
    });
  });
}

function writeStream (filePath) {
  // We use streams to compress the results on build
  const out = concat(buffer => {
    let code = buffer.toString('utf8');
    code = compressIfNeeded(code);
    writeFile(filePath, code, err => {
      if (err) return out.emit('error', err);
    });
  });
  return out;
}

function writeFile (file, code, cb) {
  fs.writeFile(file, code, err => {
    if (err) return cb(err);
    console.log(`> ${path.relative(process.cwd(), file)}`);
    cb(null);
  });
}

function compressIfNeeded (code) {
  // Only compress in build mode
  if (config.minify) {
    const result = Terser.minify(code);
    const {
      error,
      warnings = []
    } = result;
    // Log any warnings
    warnings.forEach(w => console.warn(w));
    // Log error & return empty code
    if (error) {
      console.error(error);
      return '';
    }
    code = result.code;
  }
  return code;
}

if (config.mode === 'bundle') {
  bundle();
} else if (config.mode === 'serve') {
  budo({
    stream: process.stdout,
    // Directory of dev server
    dir: config.dir,
    middleware
  });
} else {
  dev();
}
