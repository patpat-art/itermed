import type { LeaderboardNameType } from "@prisma/client";

/** Stable anonymous label — never exposes PII; same user always gets the same suffix. */
export function buildAnonymousDisplayName(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  const suffix = (hash % 9000) + 1000;
  return `Studente Anonimo #${suffix}`;
}

export function resolveLeaderboardDisplayName(params: {
  userId: string;
  name: string | null;
  nickname: string | null;
  nameType: LeaderboardNameType;
}): string {
  switch (params.nameType) {
    case "ANONYMOUS":
      return buildAnonymousDisplayName(params.userId);
    case "NICKNAME": {
      const nick = params.nickname?.trim();
      if (nick) return nick.slice(0, 40);
      return "Studente";
    }
    case "REAL_NAME":
    default: {
      const real = params.name?.trim();
      if (real) return real.slice(0, 60);
      return "Studente";
    }
  }
}
