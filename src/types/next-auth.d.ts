import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;           // hub-producao-conteudo role: "USER" | "COORDINATOR" | "INSTRUCTOR" | "ADMIN" | ""
      selectorRole?: string;  // role efetivo no módulo seletor: "INSTRUCTOR" | "COORDINATOR" | "ADMIN"
    };
  }

  interface User {
    role?: string;
    selectorRole?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    selectorRole?: string;
    name?: string | null;
  }
}
