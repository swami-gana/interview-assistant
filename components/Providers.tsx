"use client";

import { SessionProvider } from "next-auth/react";
import { StoreBootstrap } from "./StoreBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StoreBootstrap>{children}</StoreBootstrap>
    </SessionProvider>
  );
}
