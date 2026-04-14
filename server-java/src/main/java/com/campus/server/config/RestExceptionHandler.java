package com.campus.server.config;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Ensures API errors include a {@code message} field for the Vue client (in addition to Spring's Problem {@code detail}).
 */
@RestControllerAdvice
public class RestExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

  @ExceptionHandler(MissingRequestHeaderException.class)
  public ResponseEntity<Map<String, Object>> handleMissingHeader(MissingRequestHeaderException ex) {
    String name = ex.getHeaderName();
    if ("Authorization".equalsIgnoreCase(name)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("message", "请先登录后再操作（请求未携带登录凭证）。", "status", 401));
    }
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
      .body(Map.of("message", "请求缺少必要头：" + name, "status", 400));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, Object>> handle(ResponseStatusException ex) {
    HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
    String reason = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
    return ResponseEntity.status(status).body(Map.of("message", reason, "status", status.value()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
    log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
      .body(Map.of("message", "数据无法保存（内容过长或字段不合法）。请缩小图片后再发布。", "status", 400));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
    if (ex instanceof ResponseStatusException rse) {
      return handle(rse);
    }
    log.error("Unhandled exception", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
      .body(Map.of("message", "服务器内部错误，请稍后重试。", "status", 500));
  }
}
