const express = require('express');
const router = express.Router()
const mysql = require('mysql');
const async = require('async')

const pool = mysql.createPool({
        host : '',
        user : '',
        password : '',
        database : ''
});


var buildingList = [];
var roomList =[];
var departmentList = [];

function buildings(sql){
	 pool.query(sql, function(err, rows, fields) {
                if (err) {console.log(err);}
                else {
	                for (var i = 0; i < rows.length; i++) {
                                var building = {
                                        'building':rows[i].description,
                                        'bldgNum':rows[i].bldg
                                }
	                        buildingList.push(building);
                        } console.log(buildingList);
                }
        });
};

module.exports = buildings;
