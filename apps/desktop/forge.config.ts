import type { ForgeConfig } from "@electron-forge/shared-types";

const config: ForgeConfig = {
  packagerConfig: {
    name: "data pump",
    asar: true,
    // Developer ID 인증서가 없으므로 ad-hoc("-")으로 앱 번들 전체를 다시 서명한다.
    // 서명하지 않으면 Electron 바이너리의 원래 서명이 깨진 채로 남아,
    // 다운로드한 앱을 macOS가 "손상됨"으로 판정해 열 수 없다.
    // hardened runtime은 끈다. 켜면 같은 Team ID로 서명된 라이브러리만 로드할 수 있는데
    // ad-hoc 서명에는 Team ID가 없어 Electron Framework를 로드하지 못하고 실행 직후 종료된다.
    // (hardened runtime은 Apple 공증에만 필요하다)
    osxSign: {
      identity: "-",
      identityValidation: false,
      optionsForFile: () => ({ hardenedRuntime: false }),
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        authors: "Electron contributors",
      },
    },
    {
      // 열면 Applications로 끌어다 놓는 설치 화면이 나오는 macOS 배포 파일
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {
        format: "ULFO",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"],
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-vite",
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: "./main.ts",
            config: "vite.main.config.mjs",
            target: "main",
          },
          {
            entry: "./main.driver.ts",
            config: "vite.main.config.mjs",
            target: "main",
          },
          {
            entry: "./preload.ts",
            config: "vite.preload.config.mjs",
            target: "preload",
          },
        ],
        renderer: [
          {
            name: "main_window",
            config: "vite.renderer.config.mjs",
          },
        ],
      },
    },
  ],
};

export default config;
