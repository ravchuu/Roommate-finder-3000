import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    organizationId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      organizationId: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    organizationId?: string;
  }
}
