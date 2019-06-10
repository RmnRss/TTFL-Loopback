'use strict';
let app = require('../../server/server');

module.exports = function(Pick) {

  /***
   * Remote method to get all picks ofa specific user
   * @param userId
   * @param cb
   */
  Pick.ofUser = function(userId, cb) {
    let filter = '{"where":{"userId":"' + userId + '"}}';

    Pick.find(JSON.parse(filter), function(err, instance) {
      console.log(instance.length + ' picks found');
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
    console.log('Calculating scores of Picks');
  };

  /***
   * Declaring the calcScore method
   */
  Pick.remoteMethod(
    'calcScore',
    {
      returns: {arg: 'score', type: 'number'},
    },
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
    console.log(date);
    let filter = '{"where":{"date":"' + date + '"}}';

    Pick.find(JSON.parse(filter), function(err, instance) {
      console.log(instance.length + ' picks found');
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

};

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
