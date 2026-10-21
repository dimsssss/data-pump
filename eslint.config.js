import eslintConfig from "./packages/conventions/eslint.config.js";

// renderer(브라우저 환경)에서 실행되는 코드가 지켜야 하는 import 제한
const RENDERER_UTILS_ENTRY = {
  name: "@packages/utils",
  message:
    'renderer에서는 "@packages/utils/client"를 사용하세요. 루트 입구는 Node 모듈을 포함해 renderer에서 깨집니다.',
};
const RENDERER_NODE_MODULES = [
  {
    regex: "^(node:|electron(/|$))",
    message:
      "renderer에서는 Node·Electron 모듈을 쓸 수 없습니다. preload가 노출한 API를 사용하세요.",
  },
];

export default [
  { ignores: ["**/dist/**", "**/out/**", "**/.vite/**", "**/release/**"] },
  ...eslintConfig.map((c) => ({
    ...c,
    files: [
      "packages/components/**/*.{ts,tsx}",
      "packages/utils/**/*.{ts,tsx}",
      "apps/desktop/**/*.{ts,tsx}",
    ],
  })),
  // 시그니처를 맞추기 위해 받지만 쓰지 않는 매개변수는 "_" 접두어로 표시
  {
    files: [
      "packages/components/**/*.{ts,tsx}",
      "packages/utils/**/*.{ts,tsx}",
      "apps/desktop/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  // desktop은 도메인(src/<도메인>/)으로 먼저 나누고, 그 안에서 레이어로 나눈다.
  // 레이어 의존 방향 (Flutter app architecture 기준)
  //   ui/views → ui/view-models → ipc.renderer ─(preload/IPC)→ ipc.main → data/*-repository → data/(service)
  //   model, contract는 어느 레이어에서나 쓰는 순수 코드
  // ui와 ipc.renderer는 renderer(브라우저 환경)에서, ipc.main과 data는 main(Node)에서 실행된다
  {
    files: ["apps/desktop/src/main.tsx", "apps/desktop/src/*/ui/**/*.{ts,tsx}"],
    ignores: ["apps/desktop/src/*/ui/**/views/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [RENDERER_UTILS_ENTRY],
          patterns: [
            ...RENDERER_NODE_MODULES,
            {
              regex: "(^|/)data/",
              message:
                "ui는 <도메인>/ipc.renderer를 통해서만 data에 접근합니다. data는 main 프로세스 코드라 renderer에서 깨집니다.",
            },
            {
              regex: "(^|/)(ipc\\.(main|preload)|process-contract)$",
              message:
                "ui는 renderer에서 실행됩니다. main·preload·utility process 코드 대신 <도메인>/ipc.renderer를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/desktop/src/*/ui/**/views/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [RENDERER_UTILS_ENTRY],
          patterns: [
            ...RENDERER_NODE_MODULES,
            {
              regex: "(^|/)data/|(^|/)ipc\\.|(^|/)process-contract$",
              message:
                "view는 data나 IPC에 직접 접근하지 않고 view-model을 통해 사용합니다.",
            },
          ],
        },
      ],
    },
  },
  // 계약(contract)은 main·preload·renderer·utility process가 함께 import한다: 타입과 상수만 둔다
  {
    files: [
      "apps/desktop/src/*/contract.ts",
      "apps/desktop/src/*/process-contract.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ ...RENDERER_UTILS_ENTRY, allowTypeImports: true }],
          patterns: [
            ...RENDERER_NODE_MODULES,
            {
              regex: "(^|/)(ui|data|model)/|(^|/)ipc\\.",
              message:
                "contract는 다른 코드에 의존하지 않습니다. 필요한 타입은 @packages/utils에서 가져오세요.",
            },
          ],
        },
      ],
    },
  },
  // ipc.renderer는 renderer에서 preload가 노출한 API(window.*)만 사용한다
  {
    files: ["apps/desktop/src/*/ipc.renderer.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [RENDERER_UTILS_ENTRY],
          patterns: [
            ...RENDERER_NODE_MODULES,
            {
              regex: "(^|/)(ui|data)/|(^|/)ipc\\.(main|preload)$",
              message:
                "ipc.renderer는 renderer에서 실행됩니다. main 쪽에는 preload가 노출한 API(window.*)로만 접근하세요.",
            },
          ],
        },
      ],
    },
  },
  // ipc.preload는 preload에서 실행된다: contract와 electron(contextBridge·ipcRenderer)만 사용한다
  {
    files: ["apps/desktop/src/*/ipc.preload.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ ...RENDERER_UTILS_ENTRY, allowTypeImports: true }],
          patterns: [
            {
              regex: "^node:",
              message: "preload는 Node 모듈을 쓰지 않습니다.",
            },
            {
              regex: "(^|/)(ui|data)/",
              message:
                "preload는 IPC 다리 역할만 합니다. ui·data 코드는 import하지 않습니다.",
            },
          ],
        },
      ],
    },
  },
  // ipc.main은 main에서 실행된다: IPC 채널을 repository·service에 연결만 한다
  {
    files: ["apps/desktop/src/*/ipc.main.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)ui/|(^|/)ipc\\.(renderer|preload)$",
              message:
                "ipc.main은 main에서 실행됩니다. ui·renderer·preload 코드는 import하지 않습니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/desktop/src/*/data/**/*-repository.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)ui/|(^|/)ipc\\.",
              message:
                "repository는 ui와 IPC(ipc.*)에 의존하지 않습니다. IPC 연결은 ipc.main이 합니다.",
            },
          ],
        },
      ],
    },
  },
  // data 안에서 repository가 아닌 파일은 service: 외부 소스 하나를 상태 없이 감싼다
  {
    files: ["apps/desktop/src/*/data/**/*.ts"],
    ignores: ["apps/desktop/src/*/data/**/*-repository.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "-repository$",
              message:
                "service는 repository에 의존하지 않습니다 (repository → service 방향만 허용).",
            },
            {
              regex: "(^|/)ui/|(^|/)ipc\\.",
              message: "service는 ui와 IPC(ipc.*)에 의존하지 않습니다.",
            },
          ],
        },
      ],
    },
  },
  // 도메인 model은 renderer와 main이 함께 쓰는 순수 코드: 프로세스·레이어에 묶인 코드를 import하지 않는다
  {
    files: ["apps/desktop/src/*/model/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ ...RENDERER_UTILS_ENTRY, allowTypeImports: true }],
          patterns: [
            ...RENDERER_NODE_MODULES,
            {
              regex: "(^|/)(ui|data)/",
              message:
                "model은 ui와 data에 의존하지 않습니다 (ui·data → model 방향만 허용).",
            },
          ],
        },
      ],
    },
  },
  // utils 계층 의존 방향: 요청 → session → session/driver, installer는 session과 서로 모른다
  // (installer와 session의 조립은 apps/desktop/main.driver.ts에서 한다)
  {
    files: ["packages/utils/src/installer/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)session(/|$)",
              message:
                "installer는 session에 의존하지 않습니다. 둘의 연결은 main.driver.ts에서 조립하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/utils/src/session/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)installer(/|$)",
              message:
                "session은 installer를 직접 import하지 않고 생성자로 받은 loadDriver를 사용합니다.",
            },
            {
              regex: "^\\./driver/",
              message:
                'driver는 입구인 "./driver"(index.ts)를 통해서만 사용하세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/utils/src/session/driver/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./[^.]",
              message:
                "driver는 session의 하위 계층이므로 상위인 session을 import할 수 없습니다.",
            },
            {
              regex: "(^|/)installer(/|$)",
              message:
                "driver는 installer에 의존하지 않습니다. 드라이버 모듈은 connect 인자로 받으세요.",
            },
          ],
        },
      ],
    },
  },
  // driver는 session 내부 구현: 패키지 입구에서 직접 노출하지 않는다
  {
    files: ["packages/utils/index.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)session/driver(/|$)",
              message:
                "driver는 session을 통해서만 사용합니다. 필요한 타입은 session에서 re-export하세요.",
            },
          ],
        },
      ],
    },
  },
  // client 입구 자체에 Node 의존성이 들어오지 않도록 방지
  {
    files: ["packages/utils/client.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(node:|\\.\\.?/)",
              message:
                "client.ts는 renderer에서 쓰이므로 Node 모듈이나 다른 파일(Node 코드가 섞일 수 있음)을 import하지 마세요.",
            },
          ],
        },
      ],
    },
  },
];
