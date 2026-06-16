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

export interface ServerEventInput<TPayload = unknown> {
  channel: string;
  resource: string;
  action: string;
  payload: TPayload;
  message?: string;
  level?: ServerEventLevel;
}
