CREATE TABLE IF NOT EXISTS user_account (
  student_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL,
  department VARCHAR(128) NOT NULL,
  id_card_last4 VARCHAR(4) NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  password VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS news_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(32) NOT NULL,
  tag VARCHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  author VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS news_item_image_urls (
  news_item_id BIGINT NOT NULL,
  image_urls VARCHAR(500),
  CONSTRAINT fk_news_images_news
    FOREIGN KEY (news_item_id) REFERENCES news_item(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lost_found_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  place VARCHAR(255) NOT NULL,
  date VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  kind VARCHAR(32) NOT NULL DEFAULT '寻物',
  image_url LONGTEXT,
  publisher_id VARCHAR(64),
  publisher_name VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS lost_found_chat_message (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  lost_found_item_id BIGINT NOT NULL,
  from_id VARCHAR(64) NOT NULL,
  to_id VARCHAR(64) NOT NULL,
  content LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  read_flag BOOLEAN NOT NULL DEFAULT FALSE,
  message_type VARCHAR(16) NOT NULL DEFAULT 'text',
  deleted_flag BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS market_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  price DOUBLE NOT NULL,
  seller VARCHAR(128) NOT NULL,
  seller_id VARCHAR(64),
  campus VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS market_chat_message (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT NOT NULL,
  from_id VARCHAR(64) NOT NULL,
  to_id VARCHAR(64) NOT NULL,
  content TEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  read_flag BOOLEAN NOT NULL DEFAULT FALSE,
  message_type VARCHAR(16) NOT NULL DEFAULT 'text',
  deleted_flag BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS venue (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  building VARCHAR(255) NOT NULL,
  open VARCHAR(64) NOT NULL,
  seats INT NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_approver (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  department VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_approver_managed_venue_ids (
  teacher_approver_id VARCHAR(64) NOT NULL,
  managed_venue_ids VARCHAR(64),
  CONSTRAINT fk_teacher_venue_teacher
    FOREIGN KEY (teacher_approver_id) REFERENCES teacher_approver(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS push_subscription (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_student_id VARCHAR(64) NOT NULL,
  endpoint VARCHAR(512) NOT NULL,
  p256dh VARCHAR(256) NOT NULL,
  auth VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS booking (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_id VARCHAR(64) NOT NULL,
  teacher_id VARCHAR(64) NOT NULL,
  venue_id VARCHAR(64) NOT NULL,
  venue_name VARCHAR(255) NOT NULL,
  applicant VARCHAR(128) NOT NULL,
  date VARCHAR(32) NOT NULL,
  start_time VARCHAR(16) NOT NULL,
  end_time VARCHAR(16) NOT NULL,
  purpose TEXT NOT NULL,
  manager_teacher VARCHAR(128) NOT NULL,
  manager_department VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL
);
