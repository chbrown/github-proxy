/*jslint browser: true */
var github_proxy_hostname = 'localhost';

var getJSON = function(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'json';
  xhr.send();
  xhr.onreadystatechange = function() {
    /**
    readyState MDN docs:
      0: UNSENT open() has not been called yet.
      1: OPENED send() has not been called yet.
      2: HEADERS_RECEIVED send() has been called, and headers and status are available.
      3: LOADING  Downloading; responseText holds partial data.
      4: DONE The operation is complete.
    */
    if (xhr.readyState == 4) {
      callback(null, xhr.response);
    }
  };
  xhr.onerror = function(err) {
    callback(err);
  };
};

var getStats = function(owner, repo, callback) {
  /**
  getStats('joyent', 'node', function(err, stats) {
      if (err) console.error('Failed getting stats', err);
      console.log('joyent/node stats:', stats)
  });
  */
  getJSON('https://' + github_proxy_hostname + '/repos/' + owner + '/' + repo, function(err, result) {
    if (err) return callback(err);

    callback(null, {
      forks: result.forks_count,
      stars: result.stargazers_count,
      subscribers: result.subscribers_count,
    });
  });
};

var parseOwnerRepo = function(anchor) {
  // maybe better as one big regex?
  var path_segments = anchor.pathname.split('/');
  if (anchor.hostname == 'github.com') {
    // e.g., ["", "substack", "node-browserify"]
    if (path_segments.length >= 3) {
      return {owner: path_segments[1], repo: path_segments[2]};
    }
  }

  var gh_pages_match = anchor.hostname.match(/(.+)\.github\.(io|com)/);
  if (gh_pages_match) {
    // e.g., ["", "Pygmy", "Docs", "index.html"]
    if (path_segments.length >= 2) {
      return {owner: gh_pages_match[1], repo: path_segments[1]};
    }
  }
};

var decorateAnchorWithStats = function(anchor, stats) {
  // var stars = document.createElement('sup');
  // stars.textContent = stats.stars + ' ★';
  // anchor.appendChild(stars);

  // var forks = document.createElement('sub');
  // forks.textContent = stats.forks + ' ⑂';
  // anchor.appendChild(forks);
  var table = document.createElement('table');
  table.classList.add('stats');

  var star_tr = table.appendChild(document.createElement('tr'));
  var star_td1 = star_tr.appendChild(document.createElement('td'));
  star_td1.textContent = stats.stars;
  var star_td2 = star_tr.appendChild(document.createElement('td'));
  star_td2.textContent = '★';

  var fork_tr = table.appendChild(document.createElement('tr'));
  var fork_td1 = fork_tr.appendChild(document.createElement('td'));
  fork_td1.textContent = stats.forks;
  var fork_td2 = fork_tr.appendChild(document.createElement('td'));
  fork_td2.textContent = '⑂';

  anchor.appendChild(table);
};

var decorate = function(container) {
  var anchors = container.getElementsByTagName('a');
  (function loop(i) {
    var anchor = anchors[i];
    if (anchor) {
      var owner_repo = parseOwnerRepo(anchor);
      if (owner_repo) {
        getStats(owner_repo.owner, owner_repo.repo, function(err, stats) {
          if (err) {
            console.error(err, owner_repo.owner, owner_repo.repo);
            loop(i + 1);
          }
          else {
            decorateAnchorWithStats(anchor, stats);
            loop(i + 1);
          }
        });
      }
      else {
        loop(i + 1);
      }
    }
    else {
      console.log('DONE');
    }
  })(0);
};
