const express = require('express');
const mysql = require('mysql');
const router = express.Router()
const async = require('async')
const nodemailer = require("nodemailer");

const pool = mysql.createPool({
	host : '', 
	user : '', 
	password : '', 
	database : ''
});

router.get('/', function(req, res, next) {
	res.render('index');
});

let transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        secure: false,
        tls: { rejectUnauthorized: false }
});

router.post('/approvalSupervisor', function(req, res, err) {
        var sql = 'UPDATE requests SET approval_supervisor = ? WHERE request_id = ?';
	var sql_approved = "SELECT * FROM requests as r JOIN users as u ON r.wnumber = u.wnumber WHERE approval_supervisor = 'Approved' AND approval_site = 'Approved' AND request_id = ?"
        var sql_rejected = "SELECT * FROM requests as r JOIN users as u ON r.wnumber = u.wnumber WHERE (approval_supervisor = 'Rejected' OR approval_site = 'Rejected') AND request_id = ?"
        var approval = [req.body.Approval, req.body.request, req.body.wnumber];
	var reqid = req.body.request;
	async.series({
		one: function(callback){
		        pool.query(sql, approval, function(err, results, fields) {
        		        if (err) {console.log(err);}
			callback(null);
	        	});
		},
                two: function(callback){
                        pool.query(sql_approved, reqid, function(err, results, fields) {
                                if (results.length > 0) {
                                        transporter.sendMail({
                                                from: '"WACOM" <wacom@wwu.edu>',
                                                to: results[0].username+'@wwu.edu',
                                                subject: 'Your Site Visit Has Been Approved',
                                                html: "Dear "+results[0].firstname+" "+results[0].lastname+",</p>"
                                                        +"<p> Your on-site visit request to come on-site on "+results[0].startdate+" at "+results[0].starttime+" until "+results[0].endtime+" in "+results[0].buildingName+", "+results[0].room+" has been approved. "
                                                        +"This approval is for your visit only, do not extend this to anyone else or visit outside of the times or locations listed in this approval.</p>"
                                                        +"<p>Before arriving on campus, you must complete the required <a href='https://extensibility.banner.wwu.edu/BannerExtensibility/customPage/page/wwugCovidAttestEmp'>COVID-19 symptom attestation</a></p>"
                                                        +"<p><strong>When you are on campus, you must practice physical distancing of at least 6 ft from others, wear a cloth face covering, and wash or sanitize your hands frequently.</strong></p>"
                                                        +"<p>Thank you,</p>"
                                                        +"<p>Western’s COVID-19 Incident Response Team</p>"
                                        });
                                callback(null);
                                } else {callback(null);}
                        });
                },
                three: function(callback) {
                        pool.query(sql_rejected, reqid, function(err, results, fields) {
                                if (results.length > 0) {
                                        transporter.sendMail({
                                                from: '"WACOM" <wacom@wwu.edu>',
                                                to: results[0].username+'@wwu.edu',
                                                subject: 'Your Site Visit Has Been Rejected',
                                                html: "Dear "+results[0].firstname+" "+results[0].lastname+",</p>"
                                                        +"<p> Your on-site visit request "+results[0].request_id+ " to come on-site "+results[0].startdate+" at "+results[0].starttime+" until "+results[0].endtime+" in "+results[0].buildingName+", "+results[0].room+" has been rejected. "
                                                        +"You can log into the <a href='https://fmapp.fm.wwu.edu'>WACOM Site </a> to determine if your supervisor or the Covid site supervisor did not approve your request and reach out to them to discuss alternatives or get more information.</p>"
                                                        +"<p>Thank you,</p>"
                                                        +"<p>Western’s COVID-19 Incident Response Team</p>"
                                        });
                                callback(null);
                                } else {callback(null);}
                        });
                }

	}, function(err, results) {
			var data = results.one;
                        res.redirect('/person/' + req.body.wnumber)
	});
});

module.exports = router;
