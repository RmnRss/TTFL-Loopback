'use strict';
let app = require('../../server/server');

module.exports = function(User) {

  User.calcPoints = function(userId, cb) {
    console.log('Calculating points of user n° ' + userId);
    let Picks = app.models.Pick;

    Picks.ofUser(userId, function(err, data) {
      let points = 0;
      if (data.length > 0) {
        for (let pick of data) {
          points += pick.score;
        }
        console.log(points + ' pts for user : ' + userId);
        cb(null, points);
      } else {
        cb(null, points);
      }
    });
  };

  User.remoteMethod(
    'calcPoints',
    {
      http: {
        path: '/calcPoints',
        verb: 'get',
      },
      accepts: [{arg: 'userId', type: 'number', http: {source: 'query'}}],
      returns: {arg: 'points', type: 'number'},
    },
  );

  // Triggers other events on other models

  User.afterRemote('calcPoints', function(context, remoteMethodOutput, next) {
    var Team = app.models.ttflTeam;
    Team.calcPoints();
    next();
  });
};
