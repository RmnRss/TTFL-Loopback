'use strict';
let app = require('../../server/server');

module.exports = function(Ttflteam) {

  // Remote method to get all members of a team
  Ttflteam.members = function(teamId, cb) {
    let filter = '{"where":{"teamId":"' + teamId + '"}}';
    let Users = app.models.User;

    Users.find(JSON.parse(filter), function(err, members) {
      console.log(members.length + ' members found');
      cb(null, members);
    });
  };

  Ttflteam.remoteMethod(
    'members', {
      http: {
        path: '/members',
        verb: 'get',
      },
      accepts: [
        {arg: 'teamId', type: 'number', http: {source: 'query'}},
      ],
      returns: {
        arg: 'members',
        type: 'array',
      },
    },
  );

  // Remote method to calculate the points of a team
  Ttflteam.calcPoints = function(teamId, cb) {
    console.log('Calculating points of teams');

    Ttflteam.members(teamId, function(err, data) {
      let points = 0;
      if (data.length > 0) {
        for (let member of data) {
          points += member.points;
        }
        console.log(points + ' pts for team : ' + teamId);
        cb(null, points);
      } else {
        cb(null, points);
      }
    });
  };

  Ttflteam.remoteMethod(
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
  Ttflteam.afterRemote('calcPoints', function(context, remoteMethodOutput, next) {
    console.log('Updating the teams ranking');
    Ttflteam.updateRanking();
    next();
  });

  Ttflteam.updateRanking = function(cb) {
    Ttflteam.find({order: 'points DESC'}, function(err, data) {
      let teamsRanked = new Array();

      if (data.length > 0) {
        let rank = 1;
        for (let team of data) {
          team.updateAttribute('rank', rank, function(err, updatedTeam) {
            teamsRanked.push(updatedTeam);
            console.log('-----' + updatedTeam);
          });
          rank++;
        }
        cb(null, teamsRanked);
      } else {
        cb(null, teamsRanked);
      }
    });
  };

  Ttflteam.remoteMethod(
    'updateRanking',
    {
      http: {
        verb: 'get',
        path: '/updateRanking'
      },
      returns: {arg: 'teams', type: 'array'},
    },
  );

  Ttflteam.ranking = function(cb) {
    console.log('Getting teams ranks');

    Ttflteam.find({order: 'rank ASC'}, function(err, data) {
      cb(null, data);
    });
  };

  Ttflteam.remoteMethod(
    'ranking',
    {
      http: {
        verb: 'get',
        path: '/ranking',
      },
      returns: {arg: 'teams', type: 'array'},
    },
  );

};
