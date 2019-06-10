'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

var bootOptions = { "appRootDir": __dirname,
  "bootScripts" : [ "D:/Documents/GitKraken/TTFL-Loopback/server/boot/authentication.js",
    "D:/Documents/GitKraken/TTFL-Loopback/server/boot/root.js",
    "D:/Documents/GitKraken/TTFL-Loopback/server/boot/calcPickScores.js",
    "D:/Documents/GitKraken/TTFL-Loopback/server/boot/boot.js"]
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, bootOptions, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
