// Email sender stub - implemented in PR-04
// Uses Nodemailer with SMTP configuration

export async function sendEmail(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<boolean> {
  // Placeholder - PR-04 will implement
  console.log("Email stub:", options);
  return true;
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // Placeholder - PR-04 will implement
  return sendEmail({
    to: email,
    subject: "Your SITES.BD OTP Code",
    text: `Your OTP code is: ${otp}`,
  });
}