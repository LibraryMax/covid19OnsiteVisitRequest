const nodemailer = require("nodemailer");
const async = require("async");

async function main() {
	let transporter = nodemailer.createTransport({
		host: 'localhost',
		port: 25,
		seccure: false,
		tls: {
          		rejectUnauthorized: false
      		}
	});

	let info = await transporter.sendMail({
		from: '"Max Cohen" <cohenm2@wwu.edu>',
		to: '"Max Cohen" <cohenm2@wwu.edu>',
		subject: "Testing"
	});
	console.log("Message sent: %s", info.messageId);
}

main().catch(console.error);
