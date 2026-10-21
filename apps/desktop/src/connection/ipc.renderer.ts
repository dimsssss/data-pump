// renderer: preload가 노출한 ConnectionApi. ViewModel은 이것을 통해서만 main에 접근한다
import { CONNECTION_API_KEY, type ConnectionApi } from "./contract";

declare global {
  interface Window {
    [CONNECTION_API_KEY]: ConnectionApi;
  }
}

export const connectionApi: ConnectionApi = window[CONNECTION_API_KEY];
