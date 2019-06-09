'use strict';

module.exports = function(Pick) {

	Pick.ofUser = function(userId, cb) {
		var filter = '{"where":{"userId":"' + userId + '"}}';

	    Pick.find(JSON.parse(filter), function (err, instance) {
	    	console.log(instance.length);
	        cb(null, instance);
	        console.log(instance);
	    });
	};

	Pick.remoteMethod(
	'ofUser', {
            http: {
                path: '/ofUser',
                verb: 'get'
            },
            accepts: [
                {arg: 'userId', type: 'number', http: {source: 'query'}},
            ],
            returns : {
                arg: 'picks',
                type: 'array'
            }
        }
	)

};
