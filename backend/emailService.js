const nodemailer = require('nodemailer');

// Create test account for development (Ethereal Email)
// In production, replace with real SMTP credentials
let transporter = null;

const createTransporter = async () => {
    if (transporter) return transporter;

    const emailHost = (process.env.EMAIL_HOST || 'smtp.ethereal.email').trim();
    const emailPort = (process.env.EMAIL_PORT || '587').trim();
    const emailUser = (process.env.EMAIL_USER || testAccount?.user || '').trim();
    const emailPass = (process.env.EMAIL_PASS || testAccount?.pass || '').trim();

    const isSecure = emailPort == '465';

    console.log(`Configuring Email Transporter: Service=Gmail User=${emailUser ? '***' : 'None'}`);

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        logger: true, // Log SMTP exchanges
        debug: true,  // Include debug info
        family: 4     // Force IPv4 to avoid IPv6 timeouts
    });

    // Verify connection configuration
    try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
    } catch (err) {
        console.error('SMTP connection check failed:', err.message);
    }

    console.log('Email transporter created');
    if (!process.env.EMAIL_USER) {
        console.log('Using Ethereal test account:', testAccount.user);
    }

    return transporter;
};

const sendVerificationEmail = async (email, username, token) => {
    try {
        const transporter = await createTransporter();

        const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email/${token}`;

        const mailOptions = {
            // ... (options keep unchanged ideally, but for brevity here I'll assume they are constructed same way or I just wrap the send)
            from: '"GIMS Assets Manager" <noreply@gimsassets.com>',
            to: email,
            subject: 'Verify Your Email - GIMS Assets Manager',
            html: `
                <p>Hi ${username},</p>
                <p>Click here to verify: <a href="${verificationUrl}">${verificationUrl}</a></p>
                <p>This link expires in 24 hours.</p>
            `,
            text: `Verify here: ${verificationUrl}`
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Verification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);

        // FAILSAFE: Log the link so admin can verify manually
        const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email/${token}`;
        console.log('===========================================================');
        console.log('⚠️  EMAIL FAILED - MANUAL VERIFICATION LINK  ⚠️');
        console.log(`User: ${username} (${email})`);
        console.log(`Link: ${verificationUrl}`);
        console.log('===========================================================');
        console.log('Copy the link above and open it in your browser to verify.');

        return { success: false, error: error.message };
    }
};

module.exports = { sendVerificationEmail };
