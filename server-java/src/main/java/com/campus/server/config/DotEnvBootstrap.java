package com.campus.server.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;
import java.io.File;

/**
 * 在 Spring 启动前加载 {@code server-java/.env}（或当前目录下的 {@code .env}），写入 {@link System#setProperty}，
 * 以便 {@code application.yml} 中的 {@code ${VAR:default}} 能解析到。已存在于操作系统环境变量中的键不会被覆盖。
 */
public final class DotEnvBootstrap {
  private DotEnvBootstrap() {}

  public static void load() {
    String dir = resolveEnvDirectory();
    if (dir == null) {
      return;
    }
    Dotenv dotenv = Dotenv.configure().directory(dir).ignoreIfMissing().load();
    for (DotenvEntry e : dotenv.entries()) {
      String key = e.getKey();
      if (key == null || key.isBlank()) {
        continue;
      }
      if (System.getenv(key) != null) {
        continue;
      }
      if (System.getProperty(key) != null) {
        continue;
      }
      String val = e.getValue();
      // 空值不要写入，否则 ${DB_URL:默认jdbc} 会变成空串，数据源连不上或写错库，表里一直没有数据。
      if (val == null || val.isBlank()) {
        continue;
      }
      System.setProperty(key, val.trim());
    }
  }

  /** 自仓库根目录运行时用 {@code server-java/.env}；在 {@code server-java} 目录下运行时用 {@code ./.env}。 */
  private static String resolveEnvDirectory() {
    if (new File("server-java", ".env").isFile()) {
      return "server-java";
    }
    if (new File(".env").isFile()) {
      return ".";
    }
    return null;
  }
}
