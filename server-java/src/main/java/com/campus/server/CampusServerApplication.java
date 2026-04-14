package com.campus.server;

import com.campus.server.config.AppProperties;
import com.campus.server.config.DotEnvBootstrap;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class CampusServerApplication {
  public static void main(String[] args) {
    DotEnvBootstrap.load();
    SpringApplication.run(CampusServerApplication.class, args);
  }
}
