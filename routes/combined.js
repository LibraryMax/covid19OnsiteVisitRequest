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

const pool2 = mysql.createPool({
	host : '', 
	user : '', 
	password : '', 
	database : ''
});

router.get('/person/:id', function(req, res, err) {
        var sql = "SELECT * from ae_s_bld_c WHERE bldg_status in ('ACTIVE', 'CONSTRUCTION') ORDER BY description"
	var sql_rooms = "SELECT fac_id, bldg, location_code, loc_id FROM ae_b_loc_d WHERE (loc_type IS NOT NULL AND loc_type >= '40' AND loc_type <= '999') AND loc_status = 'ACTIVE'"
	var sql_departments = "SELECT oc_code, description from ae_s_oci_e"
	var sql_user = 'SELECT * FROM ae_h_emp_e as info JOIN ae_h_emp_e_udf as udf ON info.shop_person = udf.shop_person JOIN ae_s_oci_e as org ON substring(udf.custom001 FROM 11) = org.oc_code WHERE info.shop_person = ?'
	var sql_request = 'SELECT * FROM users AS u JOIN requests AS r ON u.wnumber = r.wnumber JOIN supervisors AS sup ON u.wnumber = sup.employeeW WHERE u.wnumber = ?'
	var sql_supervisor_view = 'SELECT * FROM requests as r JOIN users as u ON r.wnumber = u.wnumber WHERE r.supervisorW =?'
	var sql_site_view = "SELECT * FROM ae_s_oci_con WHERE employee_id = ? AND contact_type = 'SITE SUPERVISOR'"
	var sql_work_shift_code = "SELECT work_shift_code FROM ae_h_sch_d WHERE work_shift_code NOT LIKE '% HOUR' GROUP BY work_shift_code"
        var id = req.params.id;
        var buildingList = [];
	var roomList =[];
	var departmentList = [];
	var requestList = [];
	var requestListSup = [];
	var workShiftCodeList = [];

		async.series({
			buildings: function(callback) {
		                pool.query(sql, function(err, rows, fields) {
                		        if (err) {console.log(err);}
		                        else {
                		                for (var i = 0; i < rows.length; i++) {
                                		        var building = {
		                                                'building':rows[i].description,
                		                                'bldgNum':rows[i].bldg
                                		        }
	                        	        buildingList.push(building);
                	        	        }
                        	        callback(null, buildingList);
					}
        		        });
			},
			rooms: function(callback) {
				pool.query(sql_rooms, function(err, rows, fields) {
					if (err) {console.log(err);}
					else {
						for (var i = 0; i < rows.length; i++) {
							var room = {
								'building':rows[i].bldg,
								'roomNum':rows[i].location_code,
								'locationId':rows[i].loc_id
							}
						roomList.push(room);
						}
					callback(null, roomList);
					}
				});
			},
			userView: function(callback){
		                pool.query(sql_user, [id], function(err, rows, fields) {
                		        if (err) {console.log(err);}
		                        else {
                	                        var person = {
                        	                        'firstname':rows[0].fname,
                                	                'lastname':rows[0].lname,
	                                                'id':rows[0].shop_person,
        	                                        'userID':rows[0].user_id,
                	                                'PCN':rows[0].custom001.substr(10, 4),
                        	                        'Supervisor':rows[0].custom003,
                                	                'SupervisorW':rows[0].custom004,
							'SupervisorEmail':rows[0].custom005,
							'OrgName':rows[0].description,
							'ContactType':rows[0].contact_type,
							'ContactOrg':rows[0].oc_code
                        	                }
                                		 callback(null, person);
		                        }
                		});
			},
			requests: function(callback){
				pool2.query(sql_request, [id], function(err, rows, fields) {
					if (err) {console.log(err);}
					else {
						for (var i = 0; i < rows.length; i++) {
							var request = {
							'request':rows[i].request_id,
	                                                'firstname':rows[i].firstname,
        	                                        'lastname':rows[i].lastname,
                	                                'id':rows[i].wnumber,
                        	                        'SupervisorW':rows[i].supervisorW,
							'building':rows[i].buildingNum,
							'buildingName':rows[i].buildingName,
		                                	'room':rows[i].room,
	        		                        'startDate':rows[i].startdate,
        	        		                'startTime':rows[i].starttime,
                	        		        'endTime':rows[i].endtime,
                        	        		'reason':rows[i].reason,
							'approvalSup':rows[i].approval_supervisor,
							'approvalSite':rows[i].approval_site,
							'department':rows[i].deptName,
							'departmentNum':rows[i].deptNum
							}
							requestList.push(request);
						}
						callback(null, requestList);
					}
				});
			},
			supervisorView: function(callback){
				pool2.query(sql_supervisor_view, [id], function(err, rows, fields){
					if (rows.length > 0) {
						for (var i = 0; i < rows.length; i++){
							var sup_request = {
								'request':rows[i].request_id,
								'firstname':rows[i].firstname,
								'lastname':rows[i].lastname,
								'id':rows[i].wnumber,
								'SupervisorW':rows[i].supervisor,
								'building':rows[i].buildingNum,
								'buildingName':rows[i].buildingName,
								'room':rows[i].room,
								'startDate':rows[i].startdate,
								'startTime':rows[i].starttime,
								'endTime':rows[i].endtime,
								'reason':rows[i].reason,
								'approvalSup':rows[i].approval_supervisor,
								'approvalSite':rows[i].approval_site,
        	                                                'department':rows[i].deptName,
	                                                        'departmentNum':rows[i].deptNum
								}
								requestListSup.push(sup_request);
						}
						callback(null, requestListSup);
					} else {callback(null, err);}
				});
			},
			siteView: function(callback) {
				// First we find out if this user is a site supervisor by querying AiM
				pool.query(sql_site_view, [id], function(err, rows, fields){
					if (rows.length > 0) {
						// We pull the org code(s) associated with their site supervisor contact type
						var org = rows[0].oc_code
						var sql_site_view_local = 'SELECT * FROM requests AS r JOIN users AS u ON r.wnumber = u.wnumber WHERE r.deptNum = ?'
						// If they are a site supervisor we go to the local DB and pull all requests that have that department listed
							pool2.query(sql_site_view_local, org, function(err, rows, fields){
								if (rows.length > 0) {
									var requestListSite = [];
									for (var i = 0; i < rows.length; i++){
										var site_request = {
        	        	        	                                        'request':rows[i].request_id,
                	        	        	                                'firstname':rows[i].firstname,
                        	        	        	                        'lastname':rows[i].lastname,
                                	        	        	                'id':rows[i].wnumber,
                                	        	        		        'SupervisorW':rows[i].supervisor,
                	                                	        	        'building':rows[i].buildingNum,
		                                                        	        'buildingName':rows[i].buildingName,
        		                                                        	'room':rows[i].room,
        			                                                        'startDate':rows[i].startdate,
        	        	        	                                        'startTime':rows[i].starttime,
                	        	        	                                'endTime':rows[i].endtime,
                        	        	        	                        'reason':rows[i].reason,
											'approvalSup':rows[i].approval_supervisor,
											'approvalSite':rows[i].approval_site,
	                        			                                'department':rows[i].deptName,
				                                                        'departmentNum':rows[i].deptNum
										}
										requestListSite.push(site_request);
									}
									callback(null, requestListSite);
								}
								else { callback(null, err); }
							});
					} else { callback(null, err); }
				});
			},
                        scheduleView: function(callback) {
                                // First we find out if this user is a site supervisor by querying AiM
                                pool.query(sql_site_view, [id], function(err, rows, fields){
					if (rows.length > 0) {
						var org = rows[0].oc_code
						var sql_schedule = "SELECT emp.shop_person,"
								+" group_concat(CASE WHEN sched.work_day = 1 THEN concat('{', seq, '}', work_shift_code) END) as 'Sunday', group_concat(CASE WHEN sched.work_day = 2 THEN concat('{', seq, '}', work_shift_code) END) as 'Monday',"
								+" group_concat(CASE WHEN sched.work_day = 3 THEN concat('{', seq, '}', work_shift_code) END) as 'Tuesday', group_concat(CASE WHEN sched.work_day = 4 THEN concat('{', seq, '}', work_shift_code) END)as 'Wednesday',"
								+" group_concat(CASE WHEN sched.work_day = 5 THEN concat('{', seq, '}', work_shift_code) END) as 'Thursday', group_concat(CASE WHEN sched.work_day = 6 THEN concat('{', seq, '}', work_shift_code) END) as 'Friday',"
								+" group_concat(CASE WHEN sched.work_day = 7 THEN concat('{', seq, '}', work_shift_code) END) as 'Saturday', concat(emp.fname, ' ', emp.lname) as Name, con.oc_code as org"
								+" FROM ae_h_sch_d as sched JOIN ae_h_emp_e as emp ON sched.shop_person = emp.shop_person JOIN ae_s_oci_con as con ON emp.shop_person = con.employee_id"
								+" WHERE sched.work_shift_code != '24 HOUR' and  con.oc_code = ? and (con.contact_type LIKE 'OPS LEVEL%' or con.contact_type = 'HEI') GROUP BY emp.shop_person ORDER BY  concat(emp.fname, ' ', emp.lname)"
						pool.query(sql_schedule, org, function(err, rows, fields){
							if (rows.length > 0) {
								var scheduleList = [];
								for (var i = 0; i < rows.length; i++){
									var schedule = {
										'employeeW':rows[i].shop_person,
										'workShiftCode':rows[i].work_shift_code,
										'sunday':rows[i].Sunday,
										'monday':rows[i].Monday,
										'tuesday':rows[i].Tuesday,
										'wednesday':rows[i].Wednesday,
										'thursday':rows[i].Thursday,
										'friday':rows[i].Friday,
										'saturday':rows[i].Saturday,
										'name':rows[i].Name,
										'org':rows[i].org
									}
									scheduleList.push(schedule);
								}
								callback(null, scheduleList);
							}
							else { callback(null, err);}
						});
					} else { callback(null, err);}
				});

			},
			departments: function(callback){
				pool.query(sql_departments, function(err, results, fields) {
					if (err) {console.log(err);}
					else {
						for (var i= 0; i < results.length; i++) {
							var department ={
								'department':results[i].description,
								'departmentNum':results[i].oc_code
							}
						departmentList.push(department);
						}
					callback(null, departmentList);
					}
				});
			},
			workShiftCode: function(callback){
				pool.query( sql_work_shift_code, function(err, results, fields) {
					if (err) {console.log(err);}
					else {
						var code = {'workShiftCode':''}
						workShiftCodeList.push(code);
						for (var i= 0; i < results.length; i++) {
							var code = {
								'workShiftCode':results[i].work_shift_code
							}
							workShiftCodeList.push(code);
						}
						callback(null, workShiftCodeList);
					}
				});
			}
		},
			function(err, results){
				if (err) console.log(err);
				else {
					var buildingList = results.buildings;
					var roomList = results.rooms;
					var person = results.userView;
					var requestList = results.requests;
					var requestListSup = results.supervisorView;
					var requestListSite = results.siteView;
					var departmentList = results.departments;
					var scheduleList = results.scheduleView;
					var workShiftCodeList = results.workShiftCode;
					res.render('details', {"buildingList": buildingList, "roomList": roomList, "person": person, "requestList": requestList, "requestListSup": requestListSup,
						"requestListSite":requestListSite, 'departmentList':departmentList, 'scheduleList':scheduleList, 'workShiftCodeList':workShiftCodeList});
				}
		});

});

module.exports = router;
