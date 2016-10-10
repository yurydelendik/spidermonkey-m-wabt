/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

var jsshellPath = path.join(__dirname, 'spidermonkey',
  process.platform === 'win32' ? 'js.exe' : 'js');

function quoteFilename(name) {
  return "'" + name + "'";
}

var wast2wasmCmd = 'os.file.writeTypedArrayToFile(${out}, ' +
  'new Uint8Array(wasmTextToBinary(os.file.readFile(${in}))))';

function wast2wasm(inputFile, outputFile, callback) {
  fs.exists(inputFile, function (exists) {
    if (!exists) {
      callback(new Error('File not found: ' + inputFile));
      return;
    }
    var cmd = wast2wasmCmd.
      replace('${in}', quoteFilename(inputFile)).
      replace('${out}', quoteFilename(outputFile));
    cmd = jsshellPath + ' -e \"' + cmd + '\"';
    exec(cmd, function (err) { callback && callback(err); });
  });
}

var wasm2wastCmd = 'print(wasmBinaryToText(read(${in}, \'binary\')))';

function wasm2wast(inputFile, outputFile, callback) {
  fs.exists(inputFile, function (exists) {
    if (!exists) {
      callback(new Error('File not found: ' + inputFile));
      return;
    }
    var cmd = wasm2wastCmd.
      replace('${in}', quoteFilename(inputFile));
    cmd = jsshellPath + ' -e \"' + cmd + '\"';
    exec(cmd, function (err, stdout) {
      if (err) {
        callback && callback(err);
        return;
      }
      fs.writeFile(outputFile, stdout, callback);
    });
  });
}

module.exports = {
  wast2wasm: wast2wasm,
  wasm2wast: wasm2wast
};