#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p certs
cd certs

# 1) 테스트용 CA
openssl genrsa -out ca-key.pem 2048
openssl req -x509 -new -key ca-key.pem -sha256 -days 3650 \
  -subj "/CN=DB IDE Test CA" -out ca.pem

# 2) 서버 키와 인증서 요청
openssl genrsa -out server-key.pem 2048
openssl req -new -key server-key.pem -subj "/CN=localhost" -out server.csr

# 3) SAN 포함해서 CA로 서명
cat > server-ext.cnf <<EOF
subjectAltName = DNS:localhost, IP:127.0.0.1, IP:::1
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
EOF

openssl x509 -req -in server.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial \
  -days 825 -sha256 -extfile server-ext.cnf -out server-cert.pem

rm -f server.csr server-ext.cnf ca.srl

# 컨테이너 안의 mysql 사용자가 읽을 수 있도록 (테스트 전용 설정)
chmod 644 *.pem

echo "생성 완료: $(pwd)"
echo "앱에서 CA 파일로 지정할 파일: $(pwd)/ca.pem"