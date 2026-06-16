import { Outlet } from "react-router";
import { Toaster } from "@otbt/ui";

import { SiteFooter } from "../../modules/navigation/site-footer";
import { SiteHeader } from "../../modules/navigation/site-header";
import { StorefrontServerEventsProvider } from "../../modules/server-events/provider";

export function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col pb-10 text-foreground">
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <SiteFooter />
      <StorefrontServerEventsProvider />
      <Toaster />
    </div>
  );
}
