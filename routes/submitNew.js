const express = require('express');
const router = express.Router()
const mysql = require('mysql')
const async = require('async')
const nodemailer = require("nodemailer");

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

let transporter = nodemailer.createTransport({
	host: 'localhost',
	port: 25,
	secure: false,
	tls: { rejectUnauthorized: false }
});

router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/submitNew', function(req, res, err) {
        var sql_user = 'INSERT IGNORE INTO users VALUES(?, ?, ?, ?, ?, ?, "No")';
	var sql_supervisor = 'INSERT INTO supervisors(supervisorW, supervisorname, supervisoremail, employeeW) VALUES (?, ?, ?, ?)';
	var sql_request = 'INSERT INTO requests (wnumber, supervisorW, buildingNum, buildingName, room, deptNum, deptName, startdate, starttime, endtime, reason, PCN, approval_supervisor, approval_site, createdDate ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending", "Pending", curdate())';
	var sql_site = 'Select CONCAT(emp.fname, " ", emp.lname) as Name, emp.user_id FROM ae_s_oci_con as con JOIN ae_h_emp_e as emp on con.employee_id = emp.shop_person WHERE oc_code = ? and contact_type = "SITE SUPERVISOR"'
	var org = req.body.department.substr(0, 4);
	var siteList = [];
	var supervisorCheck = req.body.supervisorw;
        async.series({
                user: function(callback) {
			if (!supervisorCheck) {
                                var data = {
                                        'wnumber':req.body.wnumber,
                                        'firstname':req.body.firstname,
                                        'lastname':req.body.lastname,
                                        'homeorg':req.body.PCN,
                                        'supervisorw':'W01247121',
                                        'username':req.body.username
                                }
				callback(null, data);

			}
			else {
        	                var data = {
	                                'wnumber':req.body.wnumber,
                                	'firstname':req.body.firstname,
                        	        'lastname':req.body.lastname,
                	                'homeorg':req.body.PCN,
					'supervisorw':req.body.supervisorw,
					'username':req.body.username
	                        }
                        	callback(null, data);
			}
                },
                supervisor: function(callback) {
			if (!supervisorCheck) {
				var data = {
					'supervisor':'JULIE LARMORE',
					'supervisorw':'W01247121',
					'supervisoremail':'LARMORJ@wwu.edu'
				}
				callback(null, data);
			}
			else {
	                        var data = {
        	                        'supervisor':req.body.supervisor,
                	                'supervisorw':req.body.supervisorw,
                        	        'supervisoremail':req.body.supervisoremail
	                        }
        	                callback(null, data);
			}
                },
		request: function(callback) {
			if (!supervisorCheck) {
                	        var data = {
        	                        'buildingNum':req.body.building.substr(0,4),
	                                'buildingName':req.body.building.substr(4),
                                	'room':req.body.room,
                        	        'startDate':req.body.startDate,
                	                'startTime':req.body.startTime,
        	                        'endTime':req.body.endTime,
	                                'reason':req.body.reason,
                                	'supervisor':'W01247121',
                        	        'PCN':req.body.PCN,
                	                'deptNum':req.body.department.substr(0, 4),
        	                        'deptName':req.body.department.substr(4)
	                        }
				callback(null, data);

			}
			else {
				var data = {
					'buildingNum':req.body.building.substr(0,4),
					'buildingName':req.body.building.substr(4),
					'room':req.body.room,
					'startDate':req.body.startDate,
					'startTime':req.body.startTime,
					'endTime':req.body.endTime,
					'reason':req.body.reason,
					'supervisor':req.body.supervisorw,
					'PCN':req.body.PCN,
					'deptNum':req.body.department.substr(0, 4),
					'deptName':req.body.department.substr(4)
				}
			callback(null, data);
			}
		},
		site_supervisor: function(callback) {
			pool2.query(sql_site, [org], function(err, rows, fields) {
				if (err) {console.log(err);}
				else {
					for (var i = 0; i < rows.length; i++) {
						var supervisor = {
							'name':rows[i].Name,
							'userid':rows[i].user_id
						}
						siteList.push(supervisor);
					}
					callback(null, siteList);
				}
			});
		}
        }, function(err, results) {
                var data_users = results.user;
                var values_users = [data_users.wnumber, data_users.firstname, data_users.lastname, data_users.homeorg, data_users.username, data_users.supervisorw]
		var data_supervisors = results.supervisor;
		var values_supervisors = [data_supervisors.supervisorw, data_supervisors.supervisor, data_supervisors.supervisoremail, data_users.wnumber]
		var data_request = results.request;
		var values_request = [data_users.wnumber, data_request.supervisor, data_request.buildingNum, data_request.buildingName, data_request.room, data_request.deptNum, data_request.deptName, data_request.startDate, data_request.startTime, data_request.endTime, data_request.reason, data_request.PCN]
		var data_site = results.site_supervisor
                async.series({
					update_user: function(callback) {
						pool.query(sql_user, values_users, (err, results, fields) => {
								if (err) {console.log(err);}
						});
						callback(null);
					},
					update_supervisor: function(callback) {
                                                pool.query(sql_supervisor, values_supervisors, (err, results, fields) => {
                                                                if (err) {console.log(err);}
                                                });
						callback(null);

					},
                                        update_request: function(callback) {
                                                pool.query(sql_request, values_request, (err, results, fields) => {
                                                                if (err) {console.log(err);}
                                                });
                                                callback(null);
					},
					send_mail_initiator: function(callback) {
						transporter.sendMail({
							from: '"WACOM" <wacom@wwu.edu>',
							to: data_users.username+'@wwu.edu',
							subject: "New Request Submitted",
							html: "<p>Dear "+data_users.firstname+" "+data_users.lastname+",</p>"
								+"<p>Thank you for submitting your request to come on-site. Your visit will need to be approved by your supervisor and the COVID site supervisor for the area you are planning to visit for it to be complete.</p>"
								+"<p><strong>Do not come on-site until you have received notification that your request has been approved and you have completed the attestation questions in the confirmation email.</strong></p>"
								+"<p>If you have questions about where your request is in the approval process, you can find out by logging back into the <a href='https://fmapp.fm.wwu.edu'>WACOM site</a> to check the status.</p>"
						});
						callback(null);
					},
					send_mail_supervisor: function(callback) {
						transporter.sendMail({
							from: '"WACOM" <wacom@wwu.edu>',
							to: data_supervisors.supervisoremail,
							subject: "A New Request Needs Your Attention",
							html: "<p>"+data_users.firstname+" "+data_users.lastname+" has requested approval to come on-site on "+data_request.startDate+" at " +data_request.startTime+ " until " +data_request.endTime+ "."
								+" They will be at the following location: "+data_request.buildingName+", "+data_request.room+" and their reason for the visit is " +data_request.reason+".</p>"
								+"<p>Both the supervisors and the COVID site supervisors approvals are needed to complete this request. Please log into the <a href='https://fmapp.fm.wwu.edu/'>WACOM site</a> to approve or reject this request.</p>"
								+"<p>By approving this request:</p>"
								+"<ul>"
									+"<li>I am certifying this visit is required to accomplish something that is critical to my staff member's work or safety.</li>"
									+"<li>I have verified this task cannot be performed by another method or by someone already on campus.</li>"
									+"<li>I am aware campus visits must be kept to an absolute minimum.</li>"
								+"</ul>"
								+"<p>Western's COVID-19 Incident Response Team</p>"
						});
						callback(null);
					},
					send_mail_site: function(callback) {
						for (var i =0; i < data_site.length; i++) {
							transporter.sendMail({
								from: '"WACOM" <wacom@wwu.edu>',
								bcc: data_site[i].userid+'@wwu.edu',
								subject: "A New Request Needs Your Attention",
								html: "<p>"+data_users.firstname+" "+data_users.lastname+" has requested approval to come on-site on "+data_request.startDate+" at " +data_request.startTime+ " until " +data_request.endTime+ "."
								+" They will be at the following location: "+data_request.buildingName+", "+data_request.room+" and their reason for the visit is " +data_request.reason+".</p>"
                                                                +"<p>Both the supervisors and the COVID site supervisors approvals are needed to complete this request. Please log into the <a href='https://fmapp.fm.wwu.edu/'>WACOM site</a> to approve or reject this request.</p>"
                                                                +"<p>By approving this request:</p>"
                                                                +"<ul>"
                                                                        +"<li>I am certifying this visit is required to accomplish something that is critical to my staff member's work or safety.</li>"
                                                                        +"<li>I have verified this task cannot be performed by another method or by someone already on campus.</li>"
                                                                        +"<li>I am aware campus visits must be kept to an absolute minimum.</li>"
                                                                +"</ul>"
                                                                +"<p>Western's COVID-19 Incident Response Team</p>"

							});
						}
						callback(null);
					}

                }, function(err, results) {
			res.redirect('/person/' + data_users.wnumber)
                });
        });
});

module.exports = router;

//todo: change data and value to update programatically for each in etc
//todo: maybe combine sql and initial functions
