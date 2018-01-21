/*
 *
 * https://github.com/furzeface/cachebust
 *
 * Copyright (c) 2014 Daniel Furze
 * Licensed under the MIT license.]
 *
 */

'use strict';

var cheerio = require('cheerio'),
  MD5 = require('md5'),
  fs = require('fs');

exports.busted = function(fileContents, options) {
  var self = this,
      $ = cheerio.load(fileContents),
      elements = $('script[src], link[rel=stylesheet][href], img[src], img[data-src], *[style]');

  options = {
    basePath : options.basePath || "",
    type : options.type || "MD5",
    currentTimestamp : new Date().getTime()
  };

  self.MD5 = function(src, options) {
    if (!fs.existsSync(options.basePath + src)) {
      return false;
    }

    return MD5(fs.readFileSync(options.basePath + src).toString());
  };

  self.timestamp = function(src, options) {
    return options.currentTimestamp;
  };

  self.addHash = function(elem, attr) {
    var filePath = elem.attr(attr),
        hash = self[options.type](elem.attr(attr), options);

    if (attr === 'style') {
      filePath = elem.attr(attr).match(/(?:\(['"]?)(.*?)(?:['"]?\))/)[1];
      hash = self[options.type](elem.attr(attr).match(/(?:\(['"]?)(.*?)(?:['"]?\))/)[1], options);
    }

    if (!hash) {
      return;
    }

    self.replaceHash(filePath, hash);
  };

  self.replaceHash = function(filePath, hash) {
    var prefix = '?t=';

    if (options.type === 'MD5') {
      prefix = '?v=';
    }

    fileContents = fileContents.replace(new RegExp(filePath, 'g'), filePath + prefix + hash);
    fileContents = fileContents.replace(new RegExp(filePath + '\\' + prefix + hash + '\\' + prefix + hash, 'g'), filePath + prefix + hash);
  };

  elements.each(function() {
    if ($(this).attr('src')) {
      self.addHash($(this), 'src');
    }
    if ($(this).attr('href')) {
      self.addHash($(this), 'href');
    }
    if ($(this).attr('data-src')) {
      self.addHash($(this), 'data-src');
    }
    if ($(this).attr('style') && $(this).css('background-image') !== undefined || $(this).css('background') !== undefined) {
      self.addHash($(this), 'style');
    }
  });

  return fileContents;
};
