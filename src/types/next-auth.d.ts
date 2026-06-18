import type { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id:          string;
      name?:       string | null;
      email?:      string | null;
      image?:      string | null;
      role:        Role;
      coins:       number;
      points?:     number; // backward compat
      level:       string;
      telegramId:  string;
      streakDays:  number;
    };
  }

  interface User {
    role?:       Role;
    coins?:      number;
    level?:      string;
    telegramId?: string;
    streakDays?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?:          string;
    role?:        Role;
    coins?:       number;
    level?:       string;
    telegramId?:  string;
    streakDays?:  number;
  }
}
