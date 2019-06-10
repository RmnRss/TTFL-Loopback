'use strict';

module.exports = function(app) {
  console.log('Starting Boot Script');
  // Calculate every pick score

  // Find all picks of yesterday

  // For each one calculate his score

  // Calculate every user points
  let Users = app.models.User;
  let filter = '{}';

  // Find all user
  Users.find(JSON.parse(filter), function(err, users) {
    console.log(users.length + ' users found');

    // Calculate their score
    for (let user of users) {
      Users.calcPoints(user.id, function(err, points) {
        user.updateAttribute('points', points, function(err, updatedUser) {
          console.log(updatedUser.length + ' users updated');
        });
      });
    }
  });

  let Teams = app.models.ttflTeam;

  // Find all user
  Teams.find(JSON.parse(filter), function(err, teams) {
    console.log(teams.length + ' teams found');

    // Calculate their score
    for (let team of teams) {
      Teams.calcPoints(team.id, function(err, points) {
        team.updateAttribute('points', points, function(err, updatedTeam) {
          console.log(updatedTeam.length + ' teams updated');
        });
      });
    }
  });
};
