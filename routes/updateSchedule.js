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

router.post('/updateSchedule', function(req, res, err) {
		async.series({
			one: function(callback){
				var shiftList = [];
				var sun = {
					'shop_person':req.body.wnum,
					'seq':req.body.sunday,
					'workShiftCode':req.body.workShiftCodeSun,
					'day':'1'
				}
				var mon = {
					'shop_person':req.body.wnum,
					'seq':req.body.monday,
					'workShiftCode':req.body.workShiftCodeMon,
					'day':'2'
				}
				var tues = {
					'shop_person':req.body.wnum,
					'seq':req.body.tuesday,
					'workShiftCode':req.body.workShiftCodeTues,
					'day':'3'
				}
				var wed = {
					'shop_person':req.body.wnum,
					'seq':req.body.wednesday,
					'workShiftCode':req.body.workShiftCodeWed,
					'day':'4'
				}
				var thurs = {
					'shop_person':req.body.wnum,
					'seq':req.body.thursday,
					'workShiftCode':req.body.workShiftCodeThurs,
					'day':'5'
				}
				var fri = {
					'shop_person':req.body.wnum,
					'seq':req.body.friday,
					'workShiftCode':req.body.workShiftCodeFri,
					'day':'6'
				}
				var sat = {
					'shop_person':req.body.wnum,
					'seq':req.body.saturday,
					'workShiftCode':req.body.workShiftCodeSat,
					'day':'7'
				}
				shiftList.push(sun, mon, tues, wed, thurs, fri, sat);
				callback(null, shiftList);
			}
		}, function(err, results){
			let sql_new = "INSERT INTO ae_h_sch_d SET seq = (SELECT max(x.seq +1) from (SELECT * FROM ae_h_sch_d WHERE shop_person = ?) AS x), work_shift_code = ?, shop_person = ?, lunch_shift_code = 'LUNCH', work_day = ?"
			let sql_replace = "REPLACE ae_h_sch_d SET seq = ?, work_shift_code = ?, shop_person = ?, lunch_shift_code = 'LUNCH', work_day = ?, edit_date = curdate(), edit_clerk = 'schedule_updater'"
			let sql_delete = "DELETE FROM ae_h_sch_d WHERE seq = ? AND shop_person = ? AND lunch_shift_code = 'LUNCH' AND work_day = ?"
			var schedules = results.one
				for (schedule of schedules) {
					// If the sequence and the work shift code is blank do nothing
					if (schedule.seq === ' ' && schedule.workShiftCode === ''){
					}
					// If the sequence doesn't exist for that day but there's a work shift code than create a new schedule for that day
					else if (schedule.seq === ' ' && schedule.workShiftCode != ''){
						var new_sched = [schedule.shop_person, schedule.workShiftCode, schedule.shop_person, schedule.day]
						pool.query(sql_new, new_sched, function(err, rows, fields){
							if (err) {console.log(err);}
						});
					}
					// If there is a sequence for that day and the workshift code is delete than delete that entry
                                        else if (schedule.seq != ' ' && schedule.workShiftCode === 'DELETE'){
                                                var delete_sched = [schedule.seq,  schedule.shop_person, schedule.day]
                                                pool.query(sql_delete, delete_sched, function(err, rows, fields){
                                                        if (err) {console.log(err);}
                                                });
                                        }
					// If there is a sequence and a workshift for that day then just update the entry
					else if (schedule.seq != ' ' && schedule.workShiftCode != ''){
						var update_sched = [schedule.seq,  schedule.workShiftCode,  schedule.shop_person, schedule.day]
						pool.query(sql_replace, update_sched, function(err, rows, fields){
							if (err) {console.log(err);}
						});
					}
					// If there are any other combinations do nothing
					else { }
				}
			if (err) console.log(err);
			res.redirect('/person/' + req.body.id)
		});
});
module.exports = router;
