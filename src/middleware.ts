import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|login|primeiro-acesso|criar-senha|_next/static|_next/image|favicon.ico).*)",
  ],
};
