'use strict';
let app = require('../../server/server');

module.exports = function(Pick) {

  // Remote method to get all picks ofa specific user

  Pick.ofUser = function(userId, cb) {
    var filter = '{"where":{"userId":"' + userId + '"}}';

    Pick.find(JSON.parse(filter), function(err, instance) {
      console.log(instance.length + ' picks found');
      cb(null, instance);
    });
  };

  Pick.remoteMethod(
    'ofUser', {
      http: {
        path: '/ofUser',
        verb: 'get',
      },
      accepts: [
        {arg: 'userId', type: 'number', http: {source: 'query'}},
      ],
      returns: {
        arg: 'picks',
        type: 'array',
      },
    },
  );

  // Remote method to calc all scores of picks for the last day

  Pick.calcScore = function(cb) {
    console.log('Calculating scores of Picks');
  };

  Pick.remoteMethod(
    'calcScore',
    {
      returns: {arg: 'score', type: 'number'},
    },
  );

  // Triggers other events on other models

  Pick.afterRemote('calcScore', function(context, remoteMethodOutput, next) {
    var User = app.models.User;
    User.calcPoints();
    next();
  });

};
