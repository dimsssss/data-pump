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
import {
  type DriverClient,
  type DriverInfo,
  type DriverProgress,
} from "./client";

export { DriverInstaller };
export { DriverClient, DriverInfo, DriverProgress };
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

// driver는 connection 내부 구현이므로 입구에서 내보내지 않는다
export {
  ConnectionManager,
  type ConnectParams,
} from "./src/connection/ConnectionManager";
export {
  ConnectionStorageService,
  parseConnectionForm,
  defaultConnectionName,
  toSavedConnection,
  type SecretStore,
  type StoredConnection,
} from "./src/connection/ConnectionStorageService";
export type {
  ActiveConnection,
  ConnectionClient,
  ConnectionForm,
  ConnectProgress,
  ConnectResult,
  ConnectStage,
  SavedConnection,
} from "./client";
