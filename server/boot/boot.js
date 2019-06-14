'use strict';

module.exports = function(app) {
  console.log('Starting Boot Script');

  let Picks = app.models.Pick;
  Picks.calcScore(function(err, instance) {
  });

  // Calculate every user points
  let Users = app.models.User;
  let filter = '{}';

  // Find all user
  Users.find(JSON.parse(filter), function(err, users) {
    //console.log(users.length + ' users found');

    // Calculate their score
    for (let user of users) {
      Users.calcPoints(user.id, function(err, points) {
        user.updateAttribute('points', points, function(err, updatedUser) {
          // console.log(updatedUser.length + ' users updated');
        });
      });
    }
  });

  let Teams = app.models.ttflteam;

  // Find all user
  Teams.find(JSON.parse(filter), function(err, teams) {
    //console.log(teams.length + ' teams found');

    // Calculate their score
    for (let team of teams) {
      Teams.calcPoints(team.id, function(err, points) {
        team.updateAttribute('points', points, function(err, updatedTeam) {
          // console.log(updatedTeam.length + ' teams updated');
        });
      });
    }
  });

  Users.updateRanking(function(err, instance) {
  });
  Teams.updateRanking(function(err, instance) {
  });
};
