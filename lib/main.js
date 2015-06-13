var self = require("sdk/self");
var buttons = require('sdk/ui/button/action');
var Request = require("sdk/request").Request;
var tabs = require('sdk/tabs');

// To run on page load and add a forum link under comic do this:
var pageMod = require("sdk/page-mod");
pageMod.PageMod({
  include: /https:\/\/xkcd.com\/\d+\//,
  onAttach: run
});

// To run when a button is clicked and perform forum redirection automatically.
var button = buttons.ActionButton({
  id: "xkcd-forum",
  label: "Visit XKCD forum for comic",
  icon: "./xkcd.png",
  onClick: run
});

function run(state) {
  var worker = tabs.activeTab.attach({
    contentScriptFile: self.data.url("xkcd.js")
  });

  worker.port.emit('getComicId');

  worker.port.on('foundComicId', function(comicId) {
    console.log('main.foundComicId comicId=' + comicId);
    if (comicId) {
      var searchUrl = 'http://forums.xkcd.com/search.php?keywords=' + comicId + '&fid[0]=7';
      console.log('searching:' + searchUrl);
      Request({
        url: searchUrl,
        onComplete: function(resp) {
          console.log('status=' + resp.status);
          worker.port.emit('findTopic', resp.text);
        }
      }).get();
    }
  });

  worker.port.on('foundTopicHref', function(href) {
    console.log('main.foundTopicHref href=' + href);
    var newHref = 'http://forums.xkcd.com/' + href;
    console.log('main.foundTopicHref newHref=' + newHref);
    worker.port.emit('addLink', newHref);
    // tabs.activeTab.url = newHref;
  });
}
