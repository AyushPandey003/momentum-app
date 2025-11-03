import { google } from "googleapis";
import type { CalendarEvent } from "./types";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN ?? process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "https://developers.google.com/oauthplayground";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google credentials are required in env. Provide GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN (or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN)."
    );
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  return oAuth2Client;
}

export async function getCalendarEvents(timeMin: string, timeMax: string) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin,
    timeMax: timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items;
}

export async function createCalendarEvent(event: CalendarEvent) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime },
      location: event.location,
    },
  });

  return res.data;
}
