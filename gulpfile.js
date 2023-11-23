const { series,parallel,watch } = require('gulp');
const { rm } = require('fs/promises');
const { exec } = require('child_process');
const browserify = require('browserify');
const { createWriteStream } = require('fs');

// The `clean` function is not exported so it can be considered a private task.
// It can still be used within the `series()` composition.
function clean(cb) {
  // body omitted
  return Promise.all(['bundled.js','sea-prep.blob'].map(e=>rm(e)))
}

// The `build` function is exported so it is public and can be run with the `gulp` command.
// It can also be used within the `series()` composition.
function prepare_blob(cb) {
  // body omitted
  return exec('node --experimental-sea-config sea-config.json')
}
function copy_node(cb) {
    // body omitted
    return exec('cp $(command -v node) ccproxy')
}
function bundle(cb) {
    const b = browserify();
    b.add('proxy.js');
    return b.bundle().pipe(createWriteStream('bundled.js'))
}
function postject(cb) {
    return exec('npx postject ccproxy NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2');
}
//exports.build = build;
exports.proxy = series(bundle,parallel(prepare_blob,copy_node),postject,clean);
exports.test_proxy = function test_proxy() {
    return exec('./ccproxy 8000 standalone');
  }
exports.watch_proxy = function() {
    watch('proxy.js',series(exports.proxy,exports.test_proxy))
}