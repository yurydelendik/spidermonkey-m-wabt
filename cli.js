/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var lib = require('./index.js');

var path = require('path');
var fs = require('fs');

function printUsage() {
  console.error('USAGE: node %s [wast2wasm|wasm2wast] <infile> <outfile>', process.argv[1]);
  process.exit(1);
}

function parseArgs() {
  if (process.argv.length < 5) {
    printUsage();
    return;
  }

  var mode = process.argv[2];
  if (mode !== 'wast2wasm' && mode !== 'wasm2wast') {
    console.error('Invalid mode: %s', mode);
    printUsage();
    return;
  }

  return {
    mode: mode,
    inputFile: process.argv[3],
    outputFile: process.argv[4]
  };
}

var wast2wasmCmd = 'os.file.writeTypedArrayToFile(${out}, ' +
  'new Uint8Array(wasmTextToBinary(os.file.readFile(${in}))))';
var wasm2wastCmd = 'print(wasmBinaryToText(read(${in}, "binary")))';

function run(args) {
  switch (args.mode) {
    case 'wasm2wast':
      lib.wasm2wast(args.inputFile, args.outputFile, function (err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        process.exit(0);
      });
      break;
    case 'wast2wasm':
      lib.wast2wasm(args.inputFile, args.outputFile, function (err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        process.exit(0);
      });
      break;
  }
}

run(parseArgs());
