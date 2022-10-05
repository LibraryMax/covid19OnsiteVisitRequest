const https = require('https');
const express = require('express');
const Cookies = require('cookies');
const fs = require('fs');

const app = express();
const bodyParser = require('body-parser')

//Pulling in our routes
var main = require('./routes/mainPage.js')
var login = require('./routes/login.js')
var submitNew = require('./routes/submitNew.js')
var update = require('./routes/update.js')
var deleteRequest = require('./routes/delete.js')
var approvalSup = require('./routes/approvalSupervisor.js')
var approvalSite = require('./routes/approvalSite.js')
var updateSchedule = require('./routes/updateSchedule.js')
var addDelegate = require('./routes/addDelegate.js')
var delDelegate = require('./routes/deleteDelegate.js')

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname, { dotfiles: 'allow' } ));

//Main Site Pages
app.get('/', login);
app.get('/person/:id', main);
app.get('/errorLogin', login);

//Main Site Functions
app.post('/submit', login);
app.post('/submitNew', submitNew);
app.post('/update', update);
app.post('/delete', deleteRequest);
app.post('/approvalSupervisor', approvalSup);
app.post('/approvalSite', approvalSite);
app.post('/updateSchedule', updateSchedule);

//Testing Site
var testMain = require('./test/mainPage.js')
app.get('/test/:id', testMain);
app.post('/addDelegate', addDelegate);
app.post('/deleteDelegate', delDelegate);

const options = {
	key:  fs.readFileSync('./keys/fm.wwu.edu.pem'),
	cert: fs.readFileSync('./keys/fmapp_fm_wwu_edu_cert.pem')
};

https.createServer(options, app).listen(443);
