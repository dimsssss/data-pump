import type { ConnectionClient, DriverClient } from "@packages/utils/client";

declare global {
  interface Window {
    driver: DriverClient;
    connection: ConnectionClient;
  }
}
