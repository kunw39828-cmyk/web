package com.campus.server.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class AiChatService {
  private static final String SYSTEM_PROMPT =
    "你是「校园综合服务平台」的智能助手，只回答与校园服务相关的问题：通知公告、失物招领、二手市集、场馆预约与老师审批、登录与个人中心等。"
      + "回答要简洁、分条列出步骤更佳；若问题与校园服务无关，礼貌说明你的职责范围并简要指引校内相关功能。"
      + "不要编造学校不存在的政策；不确定时建议用户查看对应页面或联系教务处。";

  private final CampusFaqBot faqBot;
  private final ObjectMapper objectMapper;

  @Value("${app.ai.openai-api-key:}")
  private String openAiApiKey;

  @Value("${app.ai.openai-base-url:https://api.openai.com/v1}")
  private String openAiBaseUrl;

  @Value("${app.ai.openai-model:gpt-4o-mini}")
  private String openAiModel;

  public AiChatService(CampusFaqBot faqBot, ObjectMapper objectMapper) {
    this.faqBot = faqBot;
    this.objectMapper = objectMapper;
  }

  public String chat(String userMessage) {
    if (openAiApiKey == null || openAiApiKey.isBlank()) {
      return faqBot.reply(userMessage);
    }
    try {
      return callOpenAiCompatible(userMessage);
    } catch (Exception e) {
      return faqBot.reply(userMessage) + "\n\n（大模型服务暂时不可用，已为你显示校园指引。）";
    }
  }

  private String callOpenAiCompatible(String userMessage) throws Exception {
    RestTemplate restTemplate = new RestTemplate();
    ObjectNode root = objectMapper.createObjectNode();
    root.put("model", openAiModel);
    root.put("temperature", 0.6);
    ArrayNode messages = root.putArray("messages");
    ObjectNode sys = messages.addObject();
    sys.put("role", "system");
    sys.put("content", SYSTEM_PROMPT);
    ObjectNode user = messages.addObject();
    user.put("role", "user");
    user.put("content", userMessage);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.setBearerAuth(openAiApiKey.trim());
    HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);
    String raw = restTemplate.postForObject(openAiBaseUrl.trim() + "/chat/completions", request, String.class);

    if (raw == null || raw.isBlank()) {
      throw new RestClientException("empty response");
    }
    JsonNode tree = objectMapper.readTree(raw);
    JsonNode err = tree.path("error");
    if (!err.isMissingNode() && err.path("message").isTextual()) {
      throw new RestClientException(err.path("message").asText());
    }
    String content = tree.path("choices").path(0).path("message").path("content").asText(null);
    if (content == null || content.isBlank()) {
      throw new RestClientException("no choices");
    }
    return content.trim();
  }

  /** 供测试或管理接口扩展 */
  public Map<String, Object> status() {
    boolean llm = openAiApiKey != null && !openAiApiKey.isBlank();
    return Map.of("mode", llm ? "openai-compatible" : "campus-faq", "model", llm ? openAiModel : "local");
  }
}
