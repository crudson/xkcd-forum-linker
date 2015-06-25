var self = require("sdk/self");
var buttons = require('sdk/ui/button/action');
var Request = require("sdk/request").Request;
var tabs = require('sdk/tabs');

// To run on page load and add a forum link under comic do this:
var pageMod = require("sdk/page-mod");
pageMod.PageMod({
  include: /https?:\/\/xkcd.com\/\d+\//,
  onAttach: doAddLink
});

// To run when a button is clicked and perform forum redirection automatically.
var button = buttons.ActionButton({
  id: "xkcd-forum",
  label: "Visit XKCD forum for comic",
  icon: "./xkcd.png",
  onClick: doRedirect
});

function log(s) {
  if (require('sdk/simple-prefs').prefs['debug']) {
    console.log(s);
  }
}

function getWorker() {
  var worker = tabs.activeTab.attach({
    contentScriptFile: self.data.url("xkcd.js")
  });

  worker.port.emit('getComicId');

  worker.port.on('foundComicId', function(comicId) {
    log('main.foundComicId comicId=' + comicId);
    if (comicId) {
      var searchUrl = 'http://forums.xkcd.com/search.php?keywords=' + comicId + '&fid[0]=7';
      log('searching:' + searchUrl);
      Request({
        url: searchUrl,
        onComplete: function(resp) {
          log('status=' + resp.status);
          worker.port.emit('findTopic', resp.text);
        }
      }).get();
    }
  });

  return worker;
}

function doAddLink(state) {
  var addLinkOnLoad = require('sdk/simple-prefs').prefs['addLinkOnLoad'];
  log("addLinkOnLoad=" + addLinkOnLoad);
  if (addLinkOnLoad) {
    var worker = getWorker();

    worker.port.on('foundTopicHref', function(href) {
      log('main.foundTopicHref href=' + href);
      var newHref = 'http://forums.xkcd.com/' + href;
      log('main.foundTopicHref newHref=' + newHref);
      log('adding link');
      worker.port.emit('addLink', newHref);
    });
  }
}

function doRedirect(state) {
  var worker = getWorker();

  worker.port.on('foundTopicHref', function(href) {
    log('main.foundTopicHref href=' + href);
    var newHref = 'http://forums.xkcd.com/' + href;
    log('main.foundTopicHref newHref=' + newHref);
    log('redirecting');
    tabs.activeTab.url = newHref;
  });
}
