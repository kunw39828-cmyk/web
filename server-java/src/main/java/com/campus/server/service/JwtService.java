package com.campus.server.service;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class JwtService {
  private final SecretKey key;

  public JwtService(@Value("${app.jwt-secret}") String secret) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  public String issue(String studentId, String role) {
    long now = System.currentTimeMillis();
    return Jwts.builder()
      .subject(studentId)
      .claim("role", role)
      .issuedAt(new Date(now))
      .expiration(new Date(now + 2 * 60 * 60 * 1000))
      .signWith(key)
      .compact();
  }

  public String parseStudentId(String bearerToken) {
    String token = bearerToken == null ? "" : bearerToken.replace("Bearer ", "").trim();
    if (token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录。");
    }
    try {
      return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
    } catch (JwtException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录状态已失效。", e);
    }
  }
}
