#!/usr/bin/env bash
# macOS용 데스크톱 앱을 빌드해 GitHub Releases에 배포합니다.
#
# 사용법
#   scripts/release-mac.sh            빌드 후 v<version> 릴리스로 업로드
#   scripts/release-mac.sh --dry-run  빌드와 산출물 정리만 하고 업로드하지 않음
#
# 환경 변수
#   ARCH       빌드할 아키텍처 (arm64 | x64 | universal, 기본값: 현재 머신)
#   DIST_REPO  릴리스를 올릴 저장소 (기본값: dimsssss/data-pump)
#
# 릴리스 asset에는 빌드된 .dmg와 체크섬만 올립니다.
# GitHub가 태그마다 자동으로 붙이는 "Source code (zip/tar.gz)"는 끌 수 없습니다.
set -euo pipefail

DIST_REPO="${DIST_REPO:-dimsssss/data-pump}"
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/apps/desktop"
RELEASE_DIR="$APP_DIR/out/release"

fail() {
  echo "error: $*" >&2
  exit 1
}

[[ "$(uname -s)" == "Darwin" ]] || fail "macOS에서만 실행할 수 있습니다."

case "$(uname -m)" in
  arm64) ARCH="${ARCH:-arm64}" ;;
  *) ARCH="${ARCH:-x64}" ;;
esac

VERSION="$(node -p "require('$APP_DIR/package.json').version")"
TAG="v$VERSION"

# 배포 전 확인: 릴리스 태그가 가리킬 public main과 지금 빌드하는 소스가 같아야 함
if ! $DRY_RUN; then
  command -v gh >/dev/null || fail "gh CLI가 필요합니다."
  gh auth status >/dev/null 2>&1 || fail "gh auth login 후 다시 실행하세요."

  [[ -z "$(git -C "$ROOT" status --porcelain)" ]] || fail "커밋하지 않은 변경이 있습니다."

  HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD)"
  PUBLIC_SHA="$(gh api "repos/$DIST_REPO/commits/main" --jq .sha)"
  [[ "$HEAD_SHA" == "$PUBLIC_SHA" ]] ||
    fail "HEAD($HEAD_SHA)가 $DIST_REPO main($PUBLIC_SHA)과 다릅니다. main을 push하고 동기화를 기다린 뒤 실행하세요."

  if gh release view "$TAG" --repo "$DIST_REPO" >/dev/null 2>&1; then
    fail "$TAG 릴리스가 이미 있습니다. apps/desktop/package.json의 version을 올리세요."
  fi
fi

echo "==> 빌드: $TAG (darwin-$ARCH)"
rm -rf "$APP_DIR/out/make" "$RELEASE_DIR"
pnpm --filter desktop exec electron-forge make --platform darwin --arch "$ARCH"

# maker-dmg 산출물: out/make/<productName>.dmg
BUILT_DMG="$(find "$APP_DIR/out/make" -maxdepth 1 -name '*.dmg' -print -quit 2>/dev/null || true)"
[[ -n "$BUILT_DMG" ]] || fail "빌드 결과 dmg를 찾을 수 없습니다."

mkdir -p "$RELEASE_DIR"
ASSET="data-pump-$VERSION-mac-$ARCH.dmg"
cp "$BUILT_DMG" "$RELEASE_DIR/$ASSET"
(cd "$RELEASE_DIR" && shasum -a 256 "$ASSET" > "$ASSET.sha256")

echo "==> 산출물"
ls -lh "$RELEASE_DIR"

if $DRY_RUN; then
  echo "==> --dry-run: 업로드하지 않습니다."
  exit 0
fi

echo "==> 배포: $DIST_REPO $TAG"
NOTES="data pump $VERSION macOS($ARCH) 베타 빌드

> [!WARNING]
> 베타 버전입니다. 데이터 손실이나 예기치 않은 쿼리 실행이 일어날 수 있으니 **운영(실) 환경의 데이터베이스에는 절대 연결하지 마세요.** 로컬이나 테스트용 데이터베이스에서만 사용하세요.

- \`$ASSET\`: 열고 \`data pump.app\`을 Applications 폴더로 끌어다 놓아 설치합니다.
- \`$ASSET.sha256\`: \`shasum -a 256 -c $ASSET.sha256\`로 무결성을 확인합니다."

# draft로 올린 뒤 공개해, asset 업로드 중인 릴리스가 노출되지 않게 함
gh release create "$TAG" --repo "$DIST_REPO" --target "$HEAD_SHA" --draft \
  --title "data pump $VERSION (Beta)" --notes "$NOTES" \
  "$RELEASE_DIR/$ASSET" "$RELEASE_DIR/$ASSET.sha256"
gh release edit "$TAG" --repo "$DIST_REPO" --draft=false --latest

echo "==> 완료: https://github.com/$DIST_REPO/releases/tag/$TAG"
