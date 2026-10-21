// renderer: preload가 노출한 DatabaseApi
import { DATABASE_API_KEY, type DatabaseApi } from "./contract";

declare global {
  interface Window {
    [DATABASE_API_KEY]: DatabaseApi;
  }
}

export const databaseApi: DatabaseApi = window[DATABASE_API_KEY];
