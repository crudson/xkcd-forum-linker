self.port.on('getComicId', function() {
  var match = window.location.pathname.match(/^\/(\d+)\/?$/);
  if (match) {
    self.port.emit('foundComicId', match[1]);
  }
});

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

self.port.on('addLink', function(href) {
  var midEl = document.getElementById('middleContainer');
  var aEl = document.createElement('a');
  aEl.href = href;
  aEl.textContent = 'Forum Link';
  midEl.appendChild(document.createElement('br'));
  midEl.appendChild(aEl);
});
