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

router.post('/addDelegate', function(req, res, err) {
	let sql = "INSERT INTO delegates(wnumber, delegateWNumber, delType) SELECT * FROM (SELECT ?, ?, ?) AS tmp  WHERE NOT EXISTS (SELECT * FROM delegates WHERE wnumber = ? AND delegateWNumber = ? AND deltype = ?) LIMIT 1";
	async.series({
		one: function(callback){
			var data = {
				'wnumber':req.body.addSupDel,
				'delegateWNumber':req.body.delSupWnumber,
				'delType':req.body.delType
			}
		callback(null, data);
	}
	}, function(err, results){
		var data_add = results.one;
		var values_add =  [data_add.wnumber, data_add.delegateWNumber, data_add.delType, data_add.wnumber, data_add.delegateWNumber, data_add.delType]
		pool.query(sql, values_add, function(err, rows, fields) {
			if (err) console.log(err);
		});
		if (err) console.log(err);
		res.redirect('/person/' + data_add.wnumber)
	});

});

module.exports = router;
