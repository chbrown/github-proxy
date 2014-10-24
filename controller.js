/*jslint node: true */
var url = require('url');

var logger = require('loge');
var redis = require('redis');
var request = require('request').defaults({
  headers: {
    'User-Agent': 'github-proxy',
    'Authorization': 'token ' + process.env.GITHUB_TOKEN
  }
});

// expires in 6 hours = 6 hr * (60 min / hr) * (60 sec / min)
var cache_ttl_seconds = 6*60*60;

var get = function(url,  callback) {
  /**
  Check if url is cached in redis; if not, go out and get it.
  */
  var redis_client = redis.createClient();

  var done = function(err, result) {
    redis_client.quit();
    // escape redis's ugly exception-intercepting clutches
    setImmediate(function() {
      callback(err, result);
    });
  };

  redis_client.get(url, function(err, cached) {
    if (err) return done(err);

    if (cached) {
      logger.debug('Found %s in cache', url);
      return done(null, cached);
    }

    request.get(url, function(err, response, body) {
      if (err) return done(err);
      if (response.statusCode != 200) {
        logger.info('Non-200 response', body);
      }

      redis_client.setex(url, cache_ttl_seconds, body, function(err) {
        if (err) return done(err);

        logger.debug('Retrieved %s from web', url);
        done(null, body);
      });
    });
  });
};

module.exports = function(req, res) {
  var urlObj = url.parse(req.url);
  // replace http://localhost (or whatever) with https://api.github.com
  urlObj.hostname = 'api.github.com';
  urlObj.protocol = 'https:';
  var upstream_url = url.format(urlObj);
  get(upstream_url, function(err, body) {
    if (err) return res.die(err);

    res.setHeader('Content-Type', 'application/json');
    res.end(body);
  });
};
