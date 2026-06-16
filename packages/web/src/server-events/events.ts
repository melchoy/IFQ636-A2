export type ServerEventLevel = "success" | "error" | "warning" | "info";

export interface ServerEvent<TPayload = unknown> {
  id: string;
  channel: string;
  resource: string;
  action: string;
  payload: TPayload;
  message?: string;
  level?: ServerEventLevel;
  timestamp: string;
}

export interface ServerEventFilter {
  action?: string | string[];
}

type ServerEventCallback = (event: ServerEvent) => void;

const callbacks = new Map<string, Set<ServerEventCallback>>();

function matchesFilter(event: ServerEvent, filter?: ServerEventFilter) {
  if (!filter?.action) {
    return true;
  }

  const actions = Array.isArray(filter.action) ? filter.action : [filter.action];
  return actions.includes(event.action);
}

export function onServerEvent(
  resource: string,
  callback: ServerEventCallback,
  filter?: ServerEventFilter,
) {
  const wrapped = (event: ServerEvent) => {
    if (matchesFilter(event, filter)) {
      callback(event);
    }
  };

  if (!callbacks.has(resource)) {
    callbacks.set(resource, new Set());
  }

  callbacks.get(resource)!.add(wrapped);

  return () => {
    const resourceCallbacks = callbacks.get(resource);
    if (!resourceCallbacks) {
      return;
    }

    resourceCallbacks.delete(wrapped);
    if (resourceCallbacks.size === 0) {
      callbacks.delete(resource);
    }
  };
}

export function dispatchServerEvent(event: ServerEvent) {
  callbacks.get(event.resource)?.forEach((callback) => callback(event));
}
