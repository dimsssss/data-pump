// renderer: preload가 노출한 DriverApi
import { DRIVER_API_KEY, type DriverApi } from "./contract";

declare global {
  interface Window {
    [DRIVER_API_KEY]: DriverApi;
  }
}

export const driverApi: DriverApi = window[DRIVER_API_KEY];
