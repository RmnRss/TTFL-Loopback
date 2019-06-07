const request = require('request-promise');

//----- VARIABLES -----//

var score;

var activePlayers = new Array();
	
var scheduleUrl = "http://data.nba.net/10s/prod/v1/2018/schedule.json";
var boxScoreUrl = "http://data.nba.net/10s/prod/v1/{{gameDate}}/{{gameId}}_boxscore.json";
var ttflPicksUrl = "http://localhost:3000/api/picks";

var options = {
	uri: '',
	json: true // Automatically parses the JSON string in the response
};

var today = new Date("May 27, 2019");


//----- SCRIPT -----//

today.setUTCHours(0);
today.setUTCMinutes(0);
today.setUTCSeconds(0);
today.setUTCMilliseconds(0);

var yesterday = today.setDate(today.getDate() - 1);
var yesterdayStr = dateToString(yesterday);

console.log("Updating TTFL Pick score for the following date : " + yesterdayStr);

options.uri = scheduleUrl;

// HTTP GET : gets all scheduled games 
request(options).then(function(response) {
	// Searches through all games to find the ones played yesterday
	// For said games we fetch the box score and use player's stats to calculate the pick score
	for (var game of response.league.standard) {

		if (game.startDateEastern == yesterdayStr) {
			var gameId = game.gameId;
			
			console.log("------- GAME ------");
			console.log(game);
			
			boxScoreUrl = boxScoreUrl.replace("{{gameDate}}", yesterdayStr);
			boxScoreUrl = boxScoreUrl.replace("{{gameId}}", gameId);
			console.log(boxScoreUrl);
			options.uri = boxScoreUrl;
			
			// We fetch the game's boxscore
			request(options).then(function(response) 
			{
				activePlayers = response.stats.activePlayers;

				// Foreach active player in a game we checked if a ttfl user picked him
				for (let activePlayer of activePlayers)
				{
					console.log("ID CHECK : " + activePlayer.personId);
					
					var dateUTC = dateToAPIString(yesterday);
					options.uri = ttflPicksUrl + '?filter={"where": {"nbaPlayerId":' + activePlayer.personId + ',"date":"' + dateUTC + '"}}';
					
					//if a ttfl player picked him, we calculate his score
					request(options).then (function(response) 
					{
						if (response.length > 0)
						{
							console.log('------   PLAYER   ------');
							console.log(activePlayer);
							console.log('------   PICK   ------');
							console.log(response);
							score = calcScore(activePlayer);
						}else{
							score = 0;
						}
						
						// then we update all picks containing this player on the API
						for(result of response){
								//post
							var options = {
									method: 'PATCH',
									uri: ttflPicksUrl + '/' + result.id,
									form: {
										score: score
									},
									headers: {
									}
							};

							request(options).then(function (body) {
									// POST succeeded...
								})
								.catch(function (err) {
									// POST failed...
								});
						}
					})
				}
			})

		}
	}
})

//----- METHODS -----//

/***
Converts timestamp date to a string : YearMonthDay
***/
function dateToString(date){

var monthStr = "";
var dayStr = "";
	
var completeDate = new Date(date);
var day = completeDate.getDate();
var month = completeDate.getMonth() + 1; //January is 0
var year = completeDate.getFullYear();

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
function dateToAPIString(date){

var monthStr = "";
var dayStr = "";
	
var completeDate = new Date(date);
var day = completeDate.getDate();
var month = completeDate.getMonth() + 1; //January is 0
var year = completeDate.getFullYear();

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

return year.toString() + '-' +  monthStr + '-' + dayStr + 'T00:00:00.000Z';

}

/***
Calculate score of player based on his stats
***/
function calcScore(activePlayer) {
   
  var score;
  var bonus;
  var malus;
	  
  bonus = 	parseInt(activePlayer.blocks) + 
			parseInt(activePlayer.steals) +
			parseInt(activePlayer.assists) + 
			parseInt(activePlayer.totReb) +
			parseInt(activePlayer.points) +
			parseInt(activePlayer.fgm) +
			parseInt(activePlayer.tpm) +
			parseInt(activePlayer.ftm);
  
  malus = 	(parseInt(activePlayer.fga) - parseInt(activePlayer.fgm)) +
			(parseInt(activePlayer.fta) - parseInt(activePlayer.ftm)) +
			(parseInt(activePlayer.tpa) - parseInt(activePlayer.tpm)) +
			parseInt(activePlayer.turnovers);
  
  score = bonus - malus;
  console.log("score : " + score);
  return score;
}