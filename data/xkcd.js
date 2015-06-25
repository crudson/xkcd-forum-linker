// get id for current page
self.port.on('getComicId', function() {
  var match = null;
  if (window.location.pathname == '/') {
    // either we're looking at current comic, in which case get id from:
    // "Permanent link to this comic: http://xkcd.com/1542/<br />"
    var midEl = document.getElementById('middleContainer');
    match = midEl.textContent.match(/Permanent link to this comic: http:\/\/xkcd.com\/(\d+)\//);
  } else {
    // or we're looking at an old comic...
    match = window.location.pathname.match(/^\/(\d+)\/?$/);
  }
  if (match) {
    self.port.emit('foundComicId', match[1]);
  }
});

// get link to forum topic from search results markup
self.port.on('findTopic', function(text) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(text, "text/html");
  var posts = doc.querySelectorAll('.post');
  for (var i = 0; i < posts.length; i++) {
    var postEl = posts[i];
    if (postEl.querySelector('h3 a span.posthilit')) {
      var topicEl = postEl.querySelector('dd:nth-child(5) a');
      if (topicEl) {
        self.port.emit('foundTopicHref', topicEl.getAttribute('href'));
        return;
      }
    }
  }
  console.log('no match');
});

// add a link to forum to current page
self.port.on('addLink', function(href) {
  var midEl = document.getElementById('middleContainer');
  var aEl = document.createElement('a');
  aEl.setAttribute('id', 'xkcd-forum-link');
  aEl.href = href;
  aEl.textContent = 'Forum Link';
  midEl.appendChild(document.createElement('br'));
  midEl.appendChild(aEl);
});

// if we previously added a forum link report it, otherwise report back that we didn't
self.port.on('findExistingLink', function() {
  var aEl = document.getElementById('xkcd-forum-link');
  if (aEl) {
    self.port.emit('existingTopicHrefFound', aEl.href);
  } else {
    self.port.emit('existingTopicHrefNotFound');
  }
});
