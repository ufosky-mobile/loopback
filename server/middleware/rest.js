/*!
 * Module dependencies.
 */

var loopback = require('../../lib/loopback');
var async = require('async');

/*!
 * Export the middleware.
 */

module.exports = rest;

/**
 * Expose models over REST.
 *
 * For example:
 * ```js
 * app.use(loopback.rest());
 * ```
 * For more information, see [Exposing models over a REST API](http://docs.strongloop.com/display/DOC/Exposing+models+over+a+REST+API).
 * @header loopback.rest()
 */

function rest() {
  var router; // Cached pre-handlers

  return function restApiHandler(req, res, next) {
    var app = req.app;

    if (req.url === '/routes') {
      return res.send(app.handler('rest').adapter.allRoutes());
    } else if (req.url === '/models') {
      return res.send(app.remotes().toJSON());
    }

    if (!router) {
      router = loopback.Router();
      var remotingOptions = app.get('remoting') || {};

      var contextOptions = remotingOptions.context;
      if (contextOptions !== false) {
        if (typeof contextOptions !== 'object') {
          contextOptions = {};
        }
        router.use(loopback.context(contextOptions));
      }

      if (app.isAuthEnabled) {
        // NOTE(bajtos) It would be better to search app.models for a model
        // of type AccessToken instead of searching all loopback models.
        // Unfortunately that's not supported now.
        // Related discussions:
        // https://github.com/strongloop/loopback/pull/167
        // https://github.com/strongloop/loopback/commit/f07446a
        var AccessToken = loopback.getModelByType(loopback.AccessToken);
        router.use(loopback.token({ model: AccessToken }));
      }
    }
    router.use(function(req, res, next) {
      // Need to get an instance of the REST handler per request
      return app.handler('rest')(req, res, next);
    });
    return router(req, res, next);
  };
}
