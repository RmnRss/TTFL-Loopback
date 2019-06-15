'use strict';
let app = require('../../server/server');
const request = require('request-promise');

module.exports = function(Pick) {

  /***
   * Remote method to get all picks of a specific user
   * @param userId
   * @param cb
   */
  Pick.ofUser = function(userId, cb) {
    let filter = '{"where":{"userId":"' + userId + '"}}';

    Pick.find(JSON.parse(filter), function(err, instance) {
      //console.log(instance.length + ' picks found');
      cb(null, instance);
    });
  };

  /***
   * Declaring the ofUser method
   */
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

  /***
   * Remote method to get all scores of picks for the last day
   * @param cb
   */
  Pick.calcScore = function(cb) {
    //console.log('Calculating scores of Picks');

    // ----- VARIABLES ----- //

    let activePlayers = new Array();

    let scheduleUrl = 'http://data.nba.net/10s/prod/v1/2018/schedule.json';
    let boxScoreUrl = 'http://data.nba.net/10s/prod/v1/{{gameDate}}/{{gameId}}_boxscore.json';
    let TTFLPicksUrl = 'http://localhost:5498/api/picks';

    let options = {
      uri: '',
      json: true, // Automatically parses the JSON string in the response
    };

    let today = new Date('11 June, 2019');

    // ----- SCRIPT -----//

    // Formating date to API form

    let yesterday = today.setDate(today.getDate() - 1);
    let yesterdayStr = dateToNBAString(yesterday);

    console.log('Updating TTFLPicks scores for the following date : ' + yesterdayStr);

    options.uri = scheduleUrl;

    // HTTP GET : gets all scheduled games
    request(options).then(function(response) {

      let dateUTC = dateToAPIString(yesterday);

      // Searches through all games to find the ones played yesterday
      // For said games we fetch the box score and use player's stats to calculate the pick score
      for (let game of response.league.standard) {

        if (game.startDateEastern == yesterdayStr) {
          let gameId = game.gameId;

          //console.log("------- GAME ------");
          //console.log(game);

          boxScoreUrl = boxScoreUrl.replace('{{gameDate}}', yesterdayStr);
          boxScoreUrl = boxScoreUrl.replace('{{gameId}}', gameId);
          //console.log(boxScoreUrl);
          options.uri = boxScoreUrl;

          // We fetch the game's boxscore
          request(options).then(function(response) {
            activePlayers = response.stats.activePlayers;

            // Foreach active player in a game we checked if a ttfl user picked him
            for (let activePlayer of activePlayers) {
              let score = calcScoreFromStats(activePlayer);

              Pick.updateAll({and: [{nbaPlayerId: activePlayer.personId}, {date: dateUTC}]},
                {score: score, isUpdated: true},
                function(err, picks) {
                });
            }
          });

        }
      }
      Pick.updateAll({date: dateUTC},
        {isUpdated: true},
        function(err, picks) {
        });

    });
  };

  /***
   * Declaring the calcScore method
   */
  Pick.remoteMethod(
    'calcScore',
    {},
  );

  /***
   * Triggers other events on other models
   */
  Pick.afterRemote('calcScore', function(context, remoteMethodOutput, next) {
    let User = app.models.User;
    User.calcPoints();
    next();
  });

  /***
   * Remote method to get all picks of yesterday
   * @param cb
   */
  Pick.results = function(cb) {
    let today = new Date();

    // Formating date to API form
    let yesterday = today.setDate(today.getDate() - 1);
    let date = dateToAPIString(yesterday);
    //console.log(date);
    let filter = '{"where":{"date":"' + date + '"}}';

    Pick.find(JSON.parse(filter), function(err, instance) {
      //console.log(instance.length + ' picks found');
      cb(null, instance);
    });
  };

  /***
   * Declaring the results remote method
   */
  Pick.remoteMethod(
    'results', {
      http: {
        path: '/results',
        verb: 'get',
      },
      returns: {
        arg: 'picks',
        type: 'array',
      },
    },
  );

  /***
   * Remote method to get all banned nbaPlayers ID for a specific user
   * @param cb
   */
  Pick.bannedPlayers = function(userId, cb) {
    let today = new Date();
    let index = 0;
    let bannedIds = new Array();

    for (let i = 0; i <= 30; i++) {
      // Formating date to API form
      let yesterday = today.setDate(today.getDate() - 1);
      let date = dateToAPIString(yesterday);

      let filter = '{"where":{"userId":' + userId + ',"date":"' + date + '"}}';

      Pick.find(JSON.parse(filter), function(err, pick) {

        if(pick.length > 0){
          bannedIds[index] = pick[0].nbaPlayerId;
          console.log(bannedIds);
          index++;
        }

        if(i == 30){
        	cb(null, bannedIds);
      	}
    });
    }
  };

  /***
   * Declaring the results remote method
   */
  Pick.remoteMethod(
    'bannedPlayers', {
      http: {
        path: '/bannedPlayers',
        verb: 'get',
      },
      accepts: [
        {arg: 'userId', type: 'number', http: {source: 'query'}},
      ],
      returns: {
        arg: 'data',
        type: 'array',
      },
    },
  );

};

//----- METHODS -----//

/***
 Converts timestamp date to a string : YearMonthDay
 ***/
function dateToNBAString(date) {

  let monthStr = '';
  let dayStr = '';

  let completeDate = new Date(date);
  let day = completeDate.getDate();
  let month = completeDate.getMonth() + 1; //January is 0
  let year = completeDate.getFullYear();

  if (day < 10) {
    dayStr = '0' + day.toString();
  } else {
    dayStr = day.toString();
  }

  if (month < 10) {
    monthStr = '0' + month.toString();
  } else {
    monthStr = month.toString();
  }

  return year.toString() + monthStr + dayStr;

}

/***
 Converts timestamp date to a string : Year-Month-DayT00:00:00.000Z
 ***/
function dateToAPIString(date) {

  let monthStr = '';
  let dayStr = '';

  let completeDate = new Date(date);
  let day = completeDate.getDate();
  let month = completeDate.getMonth() + 1; //January is 0
  let year = completeDate.getFullYear();

  if (day < 10) {
    dayStr = '0' + day.toString();
  } else {
    dayStr = day.toString();
  }

  if (month < 10) {
    monthStr = '0' + month.toString();
  } else {
    monthStr = month.toString();
  }

  return year.toString() + '-' + monthStr + '-' + dayStr + 'T00:00:00.000Z';

}

/***
 Calculate the score of a NBA player based on his stats
 ***/
function calcScoreFromStats(activePlayer) {
  let score;
  let bonus;
  let malus;

  bonus = parseInt(activePlayer.blocks) +
    parseInt(activePlayer.steals) +
    parseInt(activePlayer.assists) +
    parseInt(activePlayer.totReb) +
    parseInt(activePlayer.points) +
    parseInt(activePlayer.fgm) +
    parseInt(activePlayer.tpm) +
    parseInt(activePlayer.ftm);

  malus = (parseInt(activePlayer.fga) - parseInt(activePlayer.fgm)) +
    (parseInt(activePlayer.fta) - parseInt(activePlayer.ftm)) +
    (parseInt(activePlayer.tpa) - parseInt(activePlayer.tpm)) +
    parseInt(activePlayer.turnovers);

  score = bonus - malus;

  //console.log("score : " + score);
  return score;
}
