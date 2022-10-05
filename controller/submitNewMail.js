const nodemailer = require("nodemailer");
const async = require("async");

async function main() {
	let transporter = nodemailer.createTransport({
		host: 'localhost',
		port: 25,
		secure: false,
		tls: { rejectUnauthorized: false }
	});

	let info = await transporter.sendMail({
		from: '"WACOM" <wacom@wwu.edu>',
		to: '"John Krieg" <KRIEGJ@wwu.edu>',
		subject: 'Your Site Visit Has Been Approved',
			html: "Dear John Krieg,</p>"
                        +"<p>  Your on-site visit request (23) to come on-site on 2020-12-011 at 08:46am until 4:00pm in Old Main, 475"
			+"This approval is for your visit only, do not extend this to anyone else or visit outside of the times or locations listed in this approval.</p>"
			+"<p>Before arriving on campus, you must complete the required <a href='https://extensibility.banner.wwu.edu/BannerExtensibility/customPage/page/wwugCovidAttestEmp'>COVID-19 symptom attestation</a></p>"
			+"<p><strong>When you are on campus, you must practice physical distancing of at least 6 ft from others, wear a cloth face covering, and wash or sanitize your hands frequently.</strong></p>"
			+"<p>Thank you,</p>"
	                +"<p>Western's COVID-19 Incident Response Team</p>"


	});
	console.log("Message sent: %s", info.messageId);
}

main().catch(console.error);
