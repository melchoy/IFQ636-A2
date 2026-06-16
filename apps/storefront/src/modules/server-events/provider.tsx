import { useMemo } from "react";
import { toast } from "@otbt/ui";
import {
  createServerEventClient,
  useServerEvent,
  useServerEventConnection,
} from "@otbt/web";

import {
  storefrontNotificationAction,
  storefrontNotificationResource,
} from "./events";

export function StorefrontServerEventsProvider() {
  const client = useMemo(
    () => createServerEventClient({ channel: "storefront" }),
    [],
  );

  useServerEventConnection(client);
  useServerEvent(storefrontNotificationResource, undefined, {
    action: storefrontNotificationAction,
    onEvent: (event) => {
      toast(event.message ?? "Server notification", {
        description: new Date(event.timestamp).toLocaleTimeString(),
      });
    },
  });

  return null;
}
