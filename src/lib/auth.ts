import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        
        // Get subscription status
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            stripeSubscriptionId: true,
            stripeCurrentPeriodEnd: true,
          },
        });
        
        if (dbUser) {
          session.user.subscribed = !!(
            dbUser.stripeSubscriptionId &&
            dbUser.stripeCurrentPeriodEnd &&
            dbUser.stripeCurrentPeriodEnd > new Date()
          );
        }
      }
      return session;
    },
  },
  session: {
    strategy: "database",
  },
});
