
export const getWelcomeEmail = (name: string, link: string) => {
    return {
        subject: "Welcome to SchoolBus App",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome, ${name}!</h2>
                <p>Your account has been created for the SchoolBus Administration system.</p>
                <p>Please click the button below to set up your password and log in:</p>
                <a href="${link}" style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Set Password</a>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">If you did not expect this invitation, please ignore this email.</p>
            </div>
        `
    };
};

export const getPasswordResetEmail = (link: string) => {
    return {
        subject: "Reset Your Password",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password.</p>
                <p>Click the link below to verify your email and set a new password:</p>
                <a href="${link}" style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reset Password</a>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
            </div>
        `
    };
};
