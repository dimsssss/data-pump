import { safeStorage } from "electron";
import type { SecretStore } from "@packages/utils";

// OS 보안 저장소로 비밀번호를 암호화한다.
//   macOS: Keychain / Windows: DPAPI / Linux: libsecret(GNOME Keyring) 또는 KWallet
// Linux에서 보안 저장소가 없으면 Electron은 하드코딩된 키(basic_text)로 대체하는데,
// 이는 사실상 평문이므로 이 경우 비밀번호를 저장하지 않는다.
// safeStorage는 app ready 이후에만 쓸 수 있다.
export function createSafeStorageSecrets(): SecretStore | null {
  if (!safeStorage.isEncryptionAvailable()) return null;
  if (
    process.platform === "linux" &&
    safeStorage.getSelectedStorageBackend() === "basic_text"
  ) {
    return null;
  }
  return {
    scheme: "electron-safeStorage",
    encrypt: (plain) => safeStorage.encryptString(plain).toString("base64"),
    decrypt: (data) => safeStorage.decryptString(Buffer.from(data, "base64")),
  };
}
