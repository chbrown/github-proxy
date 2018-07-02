const github_proxy_hostname = 'localhost'

/**
Create a new Element with the given attributes and childNodes
*/
function h(tagName, attrs, ...childNodes) {
  const el = document.createElement(tagName)
  // treat attrs as the first childNode if it looks like a childNode
  if (attrs instanceof Element || typeof attrs == 'string' || typeof attrs == 'number') {
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
    if (err) console.error('Failed getting stats', err)
    console.log('joyent/node stats:', stats)
})
*/
function getStats(owner, repo, callback) {
  getJSON(`https://${github_proxy_hostname}/repos/${owner}/${repo}`, (err, result) => {
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
    const [, owner, repo] = path_segments // e.g., ['', 'substack', 'node-browserify']
    if (owner && repo) {
      return {owner, repo}
    }
  }

  const gh_pages_match = anchor.hostname.match(/(.+)\.github\.(io|com)/)
  if (gh_pages_match) {
    const [, owner] = gh_pages_match
    const [, repo] = path_segments // e.g., ['', 'Pygmy', 'Docs', 'index.html']
    if (repo) {
      return {owner, repo}
    }
  }

  return {owner: null, repo: null}
}

function decorateAnchorWithStats(anchor, {stars, forks}) {
  // anchor.appendChild(h('sup', `${stars} ★`))
  // anchor.appendChild(h('sub', `${forks} ⑂`))
  const table = h('table',
                  h('tr',
                    h('td', stars.toLocaleString()),
                    h('td', '★')),
                  h('tr',
                    h('td', forks.toLocaleString()),
                    h('td', '⑂')))
  table.classList.add('stats')
  anchor.appendChild(table)
}

function decorateAllAnchors(container) {
  const anchors = container.getElementsByTagName('a')

  function loop(i) {
    const anchor = anchors[i]
    if (anchor) {
      const {owner, repo} = parseOwnerRepo(anchor)
      if (owner && repo) {
        getStats(owner, repo, (err, stats) => {
          if (err) {
            console.error(err, owner, repo)
            loop(i + 1)
          }
          else {
            decorateAnchorWithStats(anchor, stats)
            loop(i + 1)
          }
        })
      }
      else {
        // not a link to an identifiable GitHub repo -- skip it
        loop(i + 1)
      }
    }
    else {
      console.log('DONE')
    }
  }
  loop(0)
}

function installStyles() {
  const timestamp = new Date().getTime()
  const href = `https://localhost/github/github-proxy/examples/stats.css?t=${timestamp}`
  const el = h('link', {href, rel: 'stylesheet', type: 'text/css'})
  document.head.appendChild(el)
}

function init() {
  installStyles()
  decorateAllAnchors(document.querySelector('.markdown-body'))
}

// wait or immediately initialize
if (document.readyState == 'complete') {
  init()
}
else {
  document.onload = init
}
