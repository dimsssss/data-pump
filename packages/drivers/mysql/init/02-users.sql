-- TLS 연결에서만 로그인할 수 있는 사용자
CREATE USER 'tls_user'@'%' IDENTIFIED BY 'tlspass' REQUIRE SSL;
GRANT ALL PRIVILEGES ON testdb.* TO 'tls_user'@'%';

-- 읽기 전용 사용자 (권한 에러 표시 확인용)
CREATE USER 'readonly'@'%' IDENTIFIED BY 'readonlypass';
GRANT SELECT ON testdb.* TO 'readonly'@'%';

FLUSH PRIVILEGES;