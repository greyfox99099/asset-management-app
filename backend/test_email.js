const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

(async () => {
    console.log('Testing Email Configuration...');
    console.log('--------------------------------');
    console.log('HOST:', process.env.EMAIL_HOST);
    console.log('USER:', process.env.EMAIL_USER);
    console.log('PASS:', process.env.EMAIL_PASS ? '****** (Set)' : 'NOT SET');
    console.log('--------------------------------');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('ERROR: EMAIL_USER or EMAIL_PASS environment variables are missing.');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        console.log('Attempting to check connection...');
        await transporter.verify();
        console.log('✅ Connection Successful! SMTP configuration is correct.');

        console.log('Attempting to send test email to yourself...');
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Test Email from GIMS Assets",
            text: "If you receive this, your email configuration works perfectly!",
            html: "<b>If you receive this, your email configuration works perfectly!</b>",
        });

        console.log('✅ Test Email Sent!', info.messageId);
    } catch (error) {
        console.error('❌ Connection Failed or Test Email Failed:');
        console.error(error);
    }
})();
