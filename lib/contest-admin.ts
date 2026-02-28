interface AdminUser {
  id?: string | null;
  email?: string | null;
}

function parseCsv(value?: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isContestAdminUser(user?: AdminUser | null): boolean {
  if (!user) return false;

  const adminEmails = parseCsv(
    process.env.CONTEST_ADMIN_EMAILS || process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS
  );
  const adminUserIds = parseCsv(process.env.CONTEST_ADMIN_USER_IDS || process.env.ADMIN_USER_IDS);

  const email = user.email?.toLowerCase();
  const userId = user.id?.toLowerCase();

  return Boolean((email && adminEmails.has(email)) || (userId && adminUserIds.has(userId)));
}
