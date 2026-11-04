import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "BudgetBee - Password Reset Verification",
    text: [
      "Hello,",
      "",
      "We received a request to reset your BudgetBee password.",
      "",
      `Your verification code is: ${code}`,
      "",
      "This code expires in 10 minutes.",
      "If you did not request a password reset,",
      "you can safely ignore this email.",
      "",
      "BudgetBee Security Team",
    ].join("\n"),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
