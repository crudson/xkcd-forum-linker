var self = require("sdk/self");
var buttons = require('sdk/ui/button/action');
var Request = require("sdk/request").Request;
var tabs = require('sdk/tabs');

var urlMatch = /^https?:\/\/xkcd.com(\/\d+)?\/?$/;

var pageMod = require("sdk/page-mod");
pageMod.PageMod({
  include: urlMatch,
  onAttach: doAddLink
});

// To run when a button is clicked and perform forum redirection automatically.
var button = buttons.ActionButton({
  id: "xkcd-forum",
  label: "Visit XKCD forum for comic",
  icon: "./xkcd.png",
  onClick: doButton,
  disabled: true
});

tabs.on('ready', function(tab) {
  if (tab == tabs.activeTab) {
    updateButtonState(tab);
  }
});
tabs.on('activate', updateButtonState);
tabs.on('pageshow', updateButtonState);

function updateButtonState(tab) {
  button.disabled = ! tab.url.match(urlMatch);
}

function log(s) {
  if (require('sdk/simple-prefs').prefs['debug']) {
    console.log(s);
  }
}

function getWorker() {
  var worker = tabs.activeTab.attach({
    contentScriptFile: self.data.url("xkcd.js")
  });

  worker.port.on('foundComicId', function(comicId) {
    log('main.foundComicId comicId=' + comicId);
    if (comicId) {
      var paddedComicId = new Array(4 - String(comicId).length + 1).join('0') + comicId;
      console.log('main.foundComicId paddedComicId=' + paddedComicId);
      var searchUrl = 'http://forums.xkcd.com/search.php?keywords=' + paddedComicId + '&fid[0]=7';
      log('main.foundComicId searching:' + searchUrl);
      Request({
        url: searchUrl,
        onComplete: function(resp) {
          log('main.foundComicId status=' + resp.status);
          worker.port.emit('findTopic', resp.text, paddedComicId);
        }
      }).get();
    }
  });

  return worker;
}

function doAddLink(state) {
  var addLinkOnLoad = require('sdk/simple-prefs').prefs['addLinkOnLoad'];
  if (addLinkOnLoad) {
    var worker = getWorker();

    worker.port.emit('addWait');
    worker.port.emit('getComicId');

    worker.port.on('foundTopicHref', function(href) {
      log('main.foundTopicHref href=' + href);
      var newHref = 'http://forums.xkcd.com/' + href;
      worker.port.emit('addLink', newHref);
      worker.port.emit('removeWait');
    });
  }
}

function doButton(state) {
  var worker = getWorker();

  worker.port.emit('addWait');
  worker.port.emit('findExistingLink');

  worker.port.on('existingTopicHrefFound', function(href) {
    log('main.existingTopicHrefFound href=' + href);
    worker.port.emit('removeWait');
    tabs.activeTab.url = href;
  });

  worker.port.on('existingTopicHrefNotFound', function() {
    log('main.existingTopicHrefNotFound');
    worker.port.emit('getComicId');

    worker.port.on('foundTopicHref', function(href) {
      log('main.foundTopicHref href=' + href);
      worker.port.emit('removeWait');
      var newHref = 'http://forums.xkcd.com/' + href;
      tabs.activeTab.url = newHref;
    });
  });
}
