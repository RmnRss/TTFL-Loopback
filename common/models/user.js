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
    console.log('Updating the users ranking');
    User.updateRanking();
    next();
  });

  User.updateRanking = function(cb) {
    User.find({order: 'points DESC'}, function(err, data) {
      let userRanked = new Array();

      if (data.length > 0) {
        let rank = 1;
        for (let user of data) {
          user.updateAttribute('rank', rank, function(err, updatedUser) {
            userRanked.push(updatedUser);
            console.log('-----' + updatedUser);
          });
          rank++;
        }
        cb(null, userRanked);
      } else {
        cb(null, userRanked);
      }
    });
  };

  User.remoteMethod(
    'updateRanking',
    {
      http: {
        verb: 'get',
      },
      returns: {arg: 'users', type: 'array'},
    },
  );

  User.ranking = function(cb) {
    console.log('Updating the users ranks');

    User.find({order: 'rank ASC'}, function(err, data) {
      cb(null, data);
    });
  };

  User.remoteMethod(
    'ranking',
    {
      http: {
        verb: 'get',
        path: '/ranking',
      },
      returns: {arg: 'users', type: 'array'},
    },
  );
};
