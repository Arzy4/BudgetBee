import "dotenv/config";
import { sendPasswordResetEmail } from "./services/email.service.js";

async function main() {
  const recipient = process.env.TEST_EMAIL_RECIPIENT;

  if (!recipient) {
    throw new Error("TEST_EMAIL_RECIPIENT is missing");
  }

  await sendPasswordResetEmail(recipient, "123456");

  console.log("Test email accepted by Resend");
}

main().catch((error) => {
  console.error("Email test failed:", error);
  process.exitCode = 1;
});