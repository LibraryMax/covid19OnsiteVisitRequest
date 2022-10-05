const express = require('express');
const router = express.Router();
const async = require('async');
const mysql = require('mysql');
var ldap = require('ldapjs');

var client = ldap.createClient({
        url: ''
});

const pool = mysql.createPool({
	host : '', 
	user : '', 
	password : '', 
	database : ''
});

const pool2 = mysql.createPool({
	host : '', 
	user : '', 
	password : '', 
	database : ''
});

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/errorLogin', function(req, res, next) {
  res.render('indexFailure');
});

router.post('/submit', function(req, res, err) {
	var opts = {
        	filter: '(samaccountname='+req.body.username+')',
	        scope: 'sub'
	};

	var username =  req.body.username+'@wwu.edu';
	var password = req.body.password;
	var wnumber ;

	//SQL queries
	sql = "SELECT * FROM users where wnumber =?"
	sql_user = 'SELECT * FROM ae_h_emp_e as info JOIN ae_h_emp_e_udf as udf ON info.shop_person = udf.shop_person JOIN ae_s_oci_e as org ON substring(udf.custom001 FROM 11) = org.oc_code WHERE info.shop_person = ?'
	sql_user_add = 'INSERT IGNORE INTO users VALUES(?, ?, ?, ?, ?, ?, "No")';

	async.series({
		one: function(callback){
			client.bind('cn=,dc=edu', 'PASSWORD',  function (error) {
				if(error) {console.log(error); }
				else {
					client.bind(username, password, function(err) {
						if(err) {console.log(err);
							res.redirect('/errorLogin');}
						else {
							client.search('dc=univ,dc=dir,dc=wwu,dc=edu', opts, function(err, res) {
								if(err) {console.log(err);}
								else {
	                                                      		res.on('searchEntry', function(entry) {
										var wnumber = entry.object.employeeNumber;
										callback(null, wnumber);
                                                      			});
								}
							});
						}
					});
				}
			});
		}
	}, function(err, results) {
		async.series({
			two: function(callback) {
				pool2.query(sql, results.one, function(err, rows, fields) {
					if (rows.length < 1) {
                                                pool.query(sql_user, results.one, function(err, rows, fields){
                                                        var user = {
                                                                'wnumber':rows[0].shop_person,
                                                                'firstname':rows[0].fname,
                                                                'lastname':rows[0].lname,
                                                                'homeorg':rows[0].custom001.substr(10, 4),
                                                                'username':rows[0].user_id,
                                                                'supervisorW':rows[0].custom004
                                                        }
                                                        callback(null, user);
                                                });
					}
					else {res.redirect('/person/'+results.one)
						callback(null, err);}
				});
			}
		}, function (err, result) {
			data_length = Object.keys(result).length;
			if (Object.keys(result).length > 0){
				data = [result.two.wnumber,result.two.firstname, result.two.lastname, result.two.homeorg, result.two.username, result.two.supervisorW]
				pool2.query(sql_user_add, data, function(err, rows, fields){
					if (err) {console.log(err);}
					else {res.redirect('/person/'+results.one)};
				});
			}
			else {console.log(data_length);
				res.redirect('/person/'+results.one)};
		});
	});
});

module.exports = router;
