// main / utility process 전용 입구 (Node 모듈 사용).
// renderer에서는 "@packages/utils/client"를 사용할 것.
import { DriverInstaller } from "./src/installer/DriverInstaller";
import { sha256, verifyFile } from "./src/installer/checksum";
import { downloadVerified } from "./src/installer/download";
import {
  TRUSTED_KEYS,
  DEFAULT_MANIFEST_URL,
  fetchManifest,
  verifyManifestSignature,
  type DriverManifest,
  type ManifestEntry,
} from "./src/installer/manifest";
import { type DriverInfo, type DriverProgress } from "./client";

export { DriverInstaller };
export { DriverInfo, DriverProgress };
export { downloadVerified };
export { sha256, verifyFile };
export {
  DEFAULT_MANIFEST_URL,
  fetchManifest,
  verifyManifestSignature,
  DriverManifest,
  ManifestEntry,
};
export { TRUSTED_KEYS };

// driver는 session 내부 구현이므로 입구에서 내보내지 않는다
export {
  SessionManager,
  type ConnectParams,
} from "./src/session/SessionManager";
export type {
  ActiveConnection,
  ConnectionForm,
  ConnectProgress,
  ConnectResult,
  ConnectStage,
  DatabaseOverview,
  QueryResult,
  QueryValue,
  SavedConnection,
  TableSummary,
} from "./client";
