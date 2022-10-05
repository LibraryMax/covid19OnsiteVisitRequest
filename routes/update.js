const express = require('express');
const mysql = require('mysql');
const router = express.Router()
const async = require('async')

const pool = mysql.createPool({
	host : '', 
	user : '', 
	password : '', 
	database : ''
});

router.get('/', function(req, res, next) { 
	res.render('index');
});

router.post('/update', function(req, res, err) {
	let sql = "UPDATE requests SET buildingNum = ?, buildingName = ?, room = ?, startdate = ?, starttime = ?, endtime = ?, reason = ?, approval_supervisor = 'Pending', approval_site = 'Pending' where request_id = ?"
	async.series({
		one: function(callback){
			var data = {
				'request':req.body.id,
				'buildingNum':req.body.building.substr(0,4),
				'buildingName':req.body.building.substr(4),
				'room':req.body.room,
				'startDate':req.body.startDate,
				'startTime':req.body.startTime,
				'endTime':req.body.endTime,
				'reason':req.body.reason,
				'wnumber':req.body.wnum
			}
		callback(null, data);
	}
	}, function(err, results){
		var data_update = results.one;
		var values_update =  [data_update.buildingNum, data_update.buildingName, data_update.room, data_update.startDate, data_update.startTime, data_update.endTime, data_update.reason, data_update.request, data_update.wnumber]
		pool.query(sql, values_update, function(err, rows, fields) {
			if (err) console.log(err);
		});
		if (err) console.log(err);
		res.redirect('/person/' + data_update.wnumber)
	});

});

module.exports = router;
