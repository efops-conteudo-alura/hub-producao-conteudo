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

        // Busca ambos os roles em paralelo
        const [hubRole, selectorAppRole] = await Promise.all([
          prisma.appRole.findUnique({
            where: { userId_app: { userId: user.id, app: "hub-producao-conteudo" } },
          }),
          prisma.appRole.findUnique({
            where: { userId_app: { userId: user.id, app: "select-activity" } },
          }),
        ]);

        // Sem acesso em nenhum dos dois apps
        if (!hubRole && !selectorAppRole) {
          throw new Error("NoAccess");
        }

        // Instrutor: login só com email, sem senha
        if (!hubRole && selectorAppRole?.role === "INSTRUCTOR") {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "",
            selectorRole: "INSTRUCTOR",
          };
        }

        // Todos os outros casos exigem senha
        if (!user.password) {
          throw new Error("NeedPassword");
        }

        const password = (credentials.password as string) ?? "";
        if (!password) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: hubRole?.role ?? "",
          selectorRole: selectorAppRole?.role,
        };
      },
    }),
  ],
});
