SET NAMES utf8mb4;
USE testdb;

-- 다양한 타입과 경계값을 담은 테이블
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE,
  bio         TEXT,
  balance     DECIMAL(15, 2) DEFAULT 0,
  big_number  BIGINT,
  is_active   TINYINT(1) DEFAULT 1,
  profile     JSON NULL,
  avatar      BLOB NULL,
  created_at  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (name, email, bio, balance, big_number, profile, avatar) VALUES
  ('홍길동', 'hong@example.com', '일반적인 한글 데이터', 12500.50, 42,
   '{"role": "admin", "tags": ["a", "b"]}', NULL),

  -- 이모지와 다국어
  ('Emoji 🎉🚀', 'emoji@example.com', '日本語 / العربية / Ελληνικά', 0, 0, NULL, NULL),

  -- XSS 테스트: 그리드에서 텍스트로 보여야 하고, 스크립트가 실행되면 안 됨
  ('<img src=x onerror=alert(1)>', 'xss@example.com',
   '<script>alert("xss")</script>', 0, 0, '{"html": "<b>bold</b>"}', NULL),

  -- 정밀도 테스트: DECIMAL 최대값, BIGINT 최대값 (JS number로 변환하면 값이 틀어짐)
  ('Precision', 'precision@example.com', NULL,
   9999999999999.99, 9223372036854775807, NULL, NULL),

  -- NULL과 바이너리
  ('Nulls & Binary', NULL, NULL, NULL, NULL, NULL, UNHEX('89504E470D0A1A0A')),

  -- 긴 텍스트
  ('Long Text', 'long@example.com', REPEAT('긴 텍스트 테스트 ', 2000), 1, 1, NULL, NULL);

-- 외래 키 관계 (스키마 브라우저 확인용)
CREATE TABLE orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  status      ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  ordered_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO orders (user_id, amount, status) VALUES
  (1, 1000.00, 'paid'), (1, 250.50, 'pending'), (2, 99.99, 'cancelled');

-- 뷰
CREATE VIEW user_order_summary AS
SELECT u.id, u.name, COUNT(o.id) AS order_count, COALESCE(SUM(o.amount), 0) AS total
FROM users u LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name;

-- 대용량 테이블 10만 행 (가상 스크롤, 커서/스트리밍 테스트용)
CREATE TABLE digits (d TINYINT PRIMARY KEY);
INSERT INTO digits VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9);

CREATE TABLE big_table (
  id          INT PRIMARY KEY,
  label       VARCHAR(50),
  value       DOUBLE,
  created_at  DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO big_table (id, label, value, created_at)
SELECT n, CONCAT('row-', n), RAND() * 1000, NOW() - INTERVAL n MINUTE
FROM (
  SELECT a.d + b.d * 10 + c.d * 100 + e.d * 1000 + f.d * 10000 + 1 AS n
  FROM digits a
  CROSS JOIN digits b
  CROSS JOIN digits c
  CROSS JOIN digits e
  CROSS JOIN digits f
) t;

DROP TABLE digits;