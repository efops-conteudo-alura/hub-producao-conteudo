import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = (credentials.email as string).trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const hubRole = await prisma.appRole.findUnique({
          where: { userId_app: { userId: user.id, app: "hub-producao-conteudo" } },
        });

        if (!hubRole) throw new Error("NoAccess");

        if (!user.password) throw new Error("NeedPassword");

        const password = credentials.password as string;
        if (!password) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        // selectorRole: role do seletor (COORDINATOR ou INSTRUCTOR), usado para controle de acesso no módulo
        const selectorRole =
          hubRole.role === "COORDINATOR" || hubRole.role === "INSTRUCTOR"
            ? hubRole.role
            : undefined;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: hubRole.role,
          selectorRole,
        };
      },
    }),
  ],
});
