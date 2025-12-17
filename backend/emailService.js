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
        service: 'gmail', // Built-in shorthand for Gmail (handles host/port/secure auto)
        auth: {
            user: emailUser,
            pass: emailPass,
        },
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
            from: '"GIMS Assets Manager" <noreply@gimsassets.com>',
            to: email,
            subject: 'Verify Your Email - GIMS Assets Manager',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to GIMS Assets Manager!</h1>
                        </div>
                        <div class="content">
                            <p>Hi <strong>${username}</strong>,</p>
                            <p>Thank you for registering! Please verify your email address to complete your registration and start managing your assets.</p>
                            <p style="text-align: center;">
                                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                            </p>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
                            <p><strong>This link will expire in 24 hours.</strong></p>
                            <p>If you didn't create an account, you can safely ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 GIMS Assets Manager. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Welcome to GIMS Assets Manager!
                
                Hi ${username},
                
                Thank you for registering! Please verify your email address by clicking the link below:
                
                ${verificationUrl}
                
                This link will expire in 24 hours.
                
                If you didn't create an account, you can safely ignore this email.
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Verification email sent:', info.messageId);

        // For Ethereal, log the preview URL
        if (!process.env.EMAIL_USER) {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendVerificationEmail };
