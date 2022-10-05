var ldap = require('ldapjs');

var client = ldap.createClient({
	url: 'ldaps://ldap.ad.wwu.edu:636'
});

var opts = {
	filter: '(samaccountname=SULLIVS3)',
	scope: 'sub'
}

try {
	client.bind('cn=ldapqueryuser3,cn=builtin,dc=univ,dc=dir,dc=wwu,dc=edu', 'ZqWT3GtFVz7jrBfNjHKmjxnAkcxwxbam',  function (error) {
		if(error) {console.log(error);
		} else {
			console.log('connected');
			client.search('dc=univ,dc=dir,dc=wwu,dc=edu', opts, function(err, res) {
				if(err) {console.log(err);}
				else {
					res.on('searchEntry', function(entry) {
						console.log('entry: ' + JSON.stringify(entry.object));
					});
					res.on('searchReference', function(referral) {
						console.log('referral: ' + referral.uris.join());
  					});
					res.on('error', function(err) {
						console.error('error: ' + err.message);
					});
					res.on('end', function(result) {
						console.log('status: ' + result.status);
					});
				}
			});
		}
	});
} catch(error){
   console.log(error);
   client.unbind(function(error) {if(error){console.log(error.message);}       else{console.log('client disconnected');}});
}


