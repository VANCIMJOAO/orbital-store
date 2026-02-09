type LogLevel = "info" | "warn" | "error" | "debug";

function formatLog(level: LogLevel, context: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, typeof data === "object" ? JSON.stringify(data) : data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export function createLogger(context: string) {
  return {
    info: (message: string, data?: unknown) => formatLog("info", context, message, data),
    warn: (message: string, data?: unknown) => formatLog("warn", context, message, data),
    error: (message: string, data?: unknown) => formatLog("error", context, message, data),
    debug: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === "development") {
        formatLog("debug", context, message, data);
      }
    },
  };
}
