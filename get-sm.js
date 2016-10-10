/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var path = require('path');
var log = require('npmlog');
var unzip = require('unzip');
var rimraf = require('rimraf');

var smBaseUrl = 'https://ftp.mozilla.org/pub/firefox/nightly/2016/10/2016-10-01-03-04-30-mozilla-central/';
var outputDirectory = './spidermonkey';

function download(uri, callback) {
    log.http('download', uri);
    var address = {
      uri: uri,
      headers: {
       'User-Agent': 'spidermonkey-m-wabt (node: ' + process.version + ')'
      }
    };
    var proxy = process.env.http_proxy ||
                process.env.npm_config_proxy;
    if (proxy && /^https?:\/\//i.test(proxy)) {
      log.verbose('download', 'using proxy: %s', proxy);
      address.proxy = proxy;
    }
    try {
      var req = require('request')(address);
      req.on('response', function (res) {
        log.http(res.statusCode, uri);
      });
      return callback(null,req);
    } catch (e) {
      return callback(e);
    }
}

function adjustLinuxExecutable(outputDirectory) {
  var bashScript =
    '#!/bin/bash\n' +
    'scriptpath=${0%/*}\n' +
    'PATH=$scriptpath:$PATH LD_LIBRARY_PATH=$scriptpath:$LD_LIBRARY_PATH $scriptpath/js-bin $@';
  fs.renameSync(path.join(outputDirectory, 'js'), path.join(outputDirectory, 'js-bin'));
  fs.writeFileSync(path.join(outputDirectory, 'js'), bashScript);
  require('child_process').exec.call(null,
    'chmod +x "' + path.join(outputDirectory, 'js-bin') + '" "' + path.join(outputDirectory, 'js') + '"');
}

function adjustMacExecutable(outputDirectory) {
  require('child_process').exec.call(null,
    'chmod +x "' + path.join(outputDirectory, 'js') + '"');
}

function initializeOutput(outputDirectory, callback) {
  rimraf(outputDirectory, function (err) {
    if (err) {
      return callback(err);
    }
    fs.mkdir(outputDirectory, callback);
  })
}

function install() {
  var zipPath;
  if (process.platform === 'darwin') {
    zipPath = 'jsshell-mac.zip';
  } else if (process.platform === 'linux') {
    if (process.arch === 'x64') {
      zipPath = 'jsshell-linux-x86_64.zip';
    } else if (process.arch === 'ia32') {
      zipPath = 'jsshell-linux-i686.zip';
    } else {
      log.error('install', 'Unsupported linux architecture: %s', process.arch);
    }
  } else if (process.platform === 'win32') {
    if (process.arch === 'x64') {
      zipPath = 'jsshell-win64.zip';
    } else {
      zipPath = 'jsshell-win32.zip';
    }
  } else {
    log.error('install', 'Unsupported platform: %s', process.platform);
  }
  zipPath = smBaseUrl + zipPath;
  download(zipPath, function (err, req) {
    if (err) {
      log.error('download', 'Cannot download: %s, %s', zipPath, err);
      return;
    }
    log.verbose('Unzipping jsshell');
    initializeOutput(outputDirectory, function (err) {
      if (err) {
        log.error('unzip', 'Cannot create output folder: %s', outputDirectory);
        return;
      }
      req.pipe(unzip.Parse())
        .on('entry', function (entry) {
          var fileName = entry.path;
          entry.pipe(fs.createWriteStream(path.join(outputDirectory, fileName)))
        })
        .on('finish', function () {
            log.verbose('config', 'Adjusting binaries');
            if (process.platform === 'linux') {
              adjustLinuxExecutable(outputDirectory);
            } else if (process.platform === 'darwin') {
              adjustMacExecutable(outputDirectory);
            }
          });
    });
  });
}

install();
