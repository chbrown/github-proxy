const github_proxy_hostname = 'localhost'

/**
Create a new Element with the given attributes and childNodes
*/
function h(tagName, attrs, ...childNodes) {
  const el = document.createElement(tagName)
  // treat attrs as the first childNode if it looks like a childNode
  if (attrs instanceof Element || typeof attrs == 'string') {
    childNodes.unshift(attrs)
  }
  else {
    Object.keys(attrs).forEach(key => {
      el.setAttribute(key, attrs[key])
    })
  }
  childNodes.forEach(childNode => {
    if (childNode instanceof Element) {
      el.appendChild(childNode)
    }
    else {
      el.appendChild(document.createTextNode(childNode))
    }
  })
  return el
}

function getJSON(url, callback) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url)
  xhr.responseType = 'json'
  xhr.send()
  xhr.onreadystatechange = () => {
    /**
    readyState MDN docs:
      0: UNSENT open() has not been called yet.
      1: OPENED send() has not been called yet.
      2: HEADERS_RECEIVED send() has been called, and headers and status are available.
      3: LOADING  Downloading; responseText holds partial data.
      4: DONE The operation is complete.
    */
    if (xhr.readyState == 4) {
      callback(null, xhr.response)
    }
  }
  xhr.onerror = (err) => {
    callback(err)
  }
}

/**
getStats('joyent', 'node', (err, stats) => {
    if (err) console.error('Failed getting stats', err);
    console.log('joyent/node stats:', stats)
});
*/
function getStats(owner, repo, callback) {
  getJSON('https://' + github_proxy_hostname + '/repos/' + owner + '/' + repo, (err, result) => {
    if (err) return callback(err)
    const {forks_count, stargazers_count, subscribers_count} = result
    callback(null, {
      forks: forks_count,
      stars: stargazers_count,
      subscribers: subscribers_count,
    })
  })
}

function parseOwnerRepo(anchor) {
  // maybe better as one big regex?
  const path_segments = anchor.pathname.split('/')
  if (anchor.hostname == 'github.com') {
    // e.g., ["", "substack", "node-browserify"]
    if (path_segments.length >= 3) {
      return {owner: path_segments[1], repo: path_segments[2]}
    }
  }

  const gh_pages_match = anchor.hostname.match(/(.+)\.github\.(io|com)/)
  if (gh_pages_match) {
    // e.g., ["", "Pygmy", "Docs", "index.html"]
    if (path_segments.length >= 2) {
      return {owner: gh_pages_match[1], repo: path_segments[1]}
    }
  }
}

function decorateAnchorWithStats(anchor, stats) {
  // anchor.appendChild(h('sup', stats.stars + ' ★'));
  // anchor.appendChild(h('sub', stats.forks + ' ⑂'));
  const table = h('table',
                  h('tr',
                    h('td', stats.stars),
                    h('td', '★')),
                  h('tr',
                    h('td', stats.forks),
                    h('td', '⑂')))
  table.classList.add('stats')
  anchor.appendChild(table)
}

function decorate(container) {
  const anchors = container.getElementsByTagName('a')
  function loop(i) {
    const anchor = anchors[i]
    if (anchor) {
      const owner_repo = parseOwnerRepo(anchor)
      if (owner_repo) {
        getStats(owner_repo.owner, owner_repo.repo, (err, stats) => {
          if (err) {
            console.error(err, owner_repo.owner, owner_repo.repo)
            loop(i + 1)
          }
          else {
            decorateAnchorWithStats(anchor, stats)
            loop(i + 1)
          }
        })
      }
      else {
        loop(i + 1)
      }
    }
    else {
      console.log('DONE')
    }
  }
  loop(0)
}
