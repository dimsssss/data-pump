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
  // desktop 레이어 의존 방향 (Flutter app architecture 기준)
  //   views → view-models → data/clients ─(preload/IPC)→ data/repositories → data/services
  // ui와 data/clients는 renderer(브라우저 환경)에서, data/repositories·services는 main(Node)에서 실행된다
  {
    files: ["apps/desktop/src/main.tsx", "apps/desktop/src/ui/**/*.{ts,tsx}"],
    ignores: ["apps/desktop/src/ui/**/views/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [RENDERER_UTILS_ENTRY],
          patterns: [
            ...RENDERER_NODE_MODULES,
            {
              regex: "(^|/)data/(repositories|services)(/|$)",
              message:
                "ui는 data/clients를 통해서만 data에 접근합니다. repositories·services는 main 프로세스 코드라 renderer에서 깨집니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/desktop/src/ui/**/views/**/*.{ts,tsx}"],
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
                "view는 data에 직접 접근하지 않고 view-model을 통해 사용합니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/desktop/src/data/clients/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [RENDERER_UTILS_ENTRY],
          patterns: [
            ...RENDERER_NODE_MODULES,
            {
              regex: "(^|/)(repositories|services)(/|$)",
              message:
                "clients는 renderer에서 실행됩니다. main 쪽 데이터에는 preload가 노출한 API(window.*)로 접근하세요.",
            },
            { regex: "(^|/)ui/", message: "data는 ui에 의존하지 않습니다." },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/desktop/src/data/repositories/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)(ui|clients)/",
              message:
                "repository는 ui와 renderer 쪽 clients에 의존하지 않습니다.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/desktop/src/data/services/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)repositories(/|$)",
              message:
                "service는 repository에 의존하지 않습니다 (repository → service 방향만 허용).",
            },
            {
              regex: "(^|/)(ui|clients)/",
              message:
                "service는 ui와 renderer 쪽 clients에 의존하지 않습니다.",
            },
          ],
        },
      ],
    },
  },
  // utils 계층 의존 방향: 요청 → connection → connection/driver, installer는 connection과 서로 모른다
  // (installer와 connection의 조립은 apps/desktop/main.driver.ts에서 한다)
  {
    files: ["packages/utils/src/installer/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)connection(/|$)",
              message:
                "installer는 connection에 의존하지 않습니다. 둘의 연결은 main.driver.ts에서 조립하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/utils/src/connection/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)installer(/|$)",
              message:
                "connection은 installer를 직접 import하지 않고 생성자로 받은 loadDriver를 사용합니다.",
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
    files: ["packages/utils/src/connection/driver/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./[^.]",
              message:
                "driver는 connection의 하위 계층이므로 상위인 connection을 import할 수 없습니다.",
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
  // driver는 connection 내부 구현: 패키지 입구에서 직접 노출하지 않는다
  {
    files: ["packages/utils/index.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)connection/driver(/|$)",
              message:
                "driver는 connection을 통해서만 사용합니다. 필요한 타입은 connection에서 re-export하세요.",
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
