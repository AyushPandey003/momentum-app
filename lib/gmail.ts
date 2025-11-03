import { google } from "googleapis";

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

function makeRawMessage(to: string, from: string, subject: string, html: string) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendMail({ to, subject, html, from }: SendMailOptions) {
  // Allow either GMAIL_* or GOOGLE_* env var names for flexibility across environments
  const clientId = process.env.GMAIL_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN ?? process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GMAIL_REDIRECT_URI ?? process.env.GOOGLE_REDIRECT_URI ?? "https://developers.google.com/oauthplayground";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail credentials are required in env. Provide GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN (or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN)."
    );
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  // Ensure access token is fresh (google lib handles refresh internally when making requests)
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const sender = from ?? `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`;
  const raw = makeRawMessage(to, sender, subject, html);

  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return res.data;
}
