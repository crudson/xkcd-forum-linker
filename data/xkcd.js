console.log('xkcdForum.js');

self.port.on('getComicId', function() {
  var match = window.location.pathname.match(/^\/(\d+)\/?$/);
  if (match) {
    self.port.emit('foundComicId', match[1]);
  }
});

self.port.on('findTopic', function(text) {
  var el = document.createElement('html');
  el.innerHTML = text;
  var posts = el.querySelectorAll('.post');
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
});

self.port.on('addLink', function(href) {
  console.log('adding href' + href);
  var midEl = document.getElementById('middleContainer');
  midEl.innerHTML = midEl.innerHTML + '<br/><a href="' + href + '">Forum link</a>';
});
