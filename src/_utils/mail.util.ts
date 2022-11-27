import { createTransport } from "nodemailer";

import { DocumentType } from "@typegoose/typegoose";

import { UserClass } from "../_models/user.model";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions) {
  var transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 0,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  var msg = {
    from: process.env.FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  };

  return await transporter.sendMail(msg);
}

export async function sendVerificationEmail(user: DocumentType<UserClass>) {
  var token = user.generateVerificationToken();
  await user.save({ validateModifiedOnly: true }); // save token

  var url = `${process.env.BASE_URL}/api/v2/auth/confirm-email/${token}`;
  var opts: EmailOptions = {
    to: user.email,
    subject: "Verify your email",
    text: `Please click on the link to confirm your email: ${url}`,
    html: `Please click on the link to confirm your email: 🔗 <a href="${url}">Link</a>`,
  };

  try {
    await sendEmail(opts);
    var success = true;
  } catch (error) {
    // Resetting fields after failed sending email
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });
    var success = false;
  }

  return success;
}
