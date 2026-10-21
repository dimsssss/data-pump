// renderer ↔ main 사이의 driver IPC 계약 (connection/contract.ts와 같은 방식).
// 세 프로세스에서 import하므로 타입과 상수만 둔다
import type { DriverInfo, DriverProgress } from "@packages/utils/client";

// preload가 window에 노출하는 이름 (window.driver)
export const DRIVER_API_KEY = "driver";

export const DRIVER_CHANNELS = {
  install: "driver:install",
  // main → renderer 이벤트
  progress: "driver:progress",
} as const;

export interface DriverApi {
  download(name: string): Promise<DriverInfo>;
  onProgress(cb: (p: DriverProgress) => void): () => void;
}
