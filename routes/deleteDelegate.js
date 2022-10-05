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

router.post('/deleteDelegate', function(req, res, err) {
	let sql = 'DELETE FROM delegates where request_id = ?'
	async.series({
		one: function(callback){
			var data = {
				'id':req.body.deleteSupDelegate,
				'wnumber':req.body.wnumber
			}
		callback(null, data);
	}
	}, function(err, results){
		var data_delete = results.one;
		var values_delete =  [data_delete.id, data_delete.wnumber]
		pool.query(sql, data_delete.id, function(err, rows, fields) {
			if (err) console.log(err);
		});
		if (err) console.log(err);
		res.redirect('/person/' + data_delete.wnumber)
	});

});

module.exports = router;
