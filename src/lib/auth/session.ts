// Session management stub - implemented in PR-04

export type SessionUser = {
  id: string;
  email: string;
  fullName?: string;
  role?: "user" | "admin";
};

export async function getSession(): Promise<SessionUser | null> {
  // Placeholder - PR-04 will implement
  return null;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}