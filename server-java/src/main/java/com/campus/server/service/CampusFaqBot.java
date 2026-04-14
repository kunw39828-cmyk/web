package com.campus.server.service;

import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * 未配置大模型 API 时的校园业务指引；关键词命中 + 默认兜底说明。
 */
@Component
public class CampusFaqBot {

  private static final String DEFAULT =
    "我是校园综合服务平台助手。你可以问我：通知公告、失物招领、二手市集、场馆预约、登录与个人中心等问题。"
      + "\n\n顶部导航可进入各模块：「通知公告」「失物招领」「二手市集」「场馆预约」「AI 服务助手」「个人中心」。"
      + "\n学生可预约场馆并等待老师审批；老师账号可在「老师审批」中处理预约。"
      + "\n登录支持学号密码或微信扫码（需先绑定微信）。";

  public String reply(String question) {
    String q = question == null ? "" : question.trim();
    if (q.isEmpty()) {
      return "请输入你的问题，例如：怎么发布通知、如何预约场馆、二手怎么卖等。";
    }
    String low = q.toLowerCase(Locale.ROOT);

    if (containsAny(q, "通知", "公告", "教务", "发布通知", "新闻")) {
      return "【通知公告】在顶部进入「通知公告」可浏览全校通知。"
        + "\n老师登录后可通过「发布通知」撰写标题、摘要与标签；学生仅可查看。"
        + "\n首页「近期动态」为展示示例，完整列表请以通知页为准。";
    }
    if (containsAny(q, "失物", "招领", "丢", "捡", "寻物")) {
      return "【失物招领】进入「失物招领」浏览信息；登录后在「发布失物」填写物品、地点与状态（如寻找中）。"
        + "\n建议描述清晰，便于同学认领。";
    }
    if (containsAny(q, "二手", "市集", "卖", "买", "出售", "商品", "教材")) {
      return "【二手市集】登录后点「我要出售」填写商品名、价格与校区；在列表中可浏览他人商品并「立即购买」（演示为下单提示）。"
        + "\n交易请自行线下沟通，注意安全。";
    }
    if (containsAny(q, "预约", "场馆", "报告厅", "活动室", "舞蹈", "研讨室", "时间段", "审批")) {
      return "【场馆预约】在「场馆预约」中选择场馆、负责审批的老师、使用日期与起止时间，并填写用途后提交。"
        + "\n申请状态为「待老师审批」时，请等待对应老师处理；通过或驳回后状态会更新。"
        + "\n开始时间必须早于结束时间。";
    }
    if (containsAny(q, "老师审批", "通过", "驳回", "待审批") && containsAny(q, "老师", "审批", "通过", "驳回")) {
      return "【老师审批】使用老师账号（如教务账号）登录后，顶部会出现「老师审批」。"
        + "\n在列表中可查看待处理预约，选择「通过」或「驳回」。";
    }
    if (containsAny(q, "登录", "密码", "学号", "微信", "扫码", "绑定")) {
      return "【登录与账号】在「登录 / 统一认证」页可使用学号+密码登录。"
        + "\n微信扫码需该学号已绑定微信；未绑定可登录后在「个人中心」操作绑定。"
        + "\n演示学生：20260001 / 123456；老师：T2026001 / 888888。";
    }
    if (containsAny(q, "个人中心", "资料", "退出")) {
      return "【个人中心】登录后可在顶部进入，查看姓名、院系、身份与微信绑定状态，并可退出当前账号。";
    }
    if (containsAny(q, "ai", "助手", "机器人", "你好", "您好") || q.length() <= 4) {
      return "你好！我是校园服务助手，可解答本平台内通知、失物、二手、预约与登录等问题。"
        + "\n试着问：「怎么预约场馆？」「老师怎么审批？」";
    }
    if (containsAny(low, "help", "how", "what")) {
      return DEFAULT + "\n\nYou can also ask in Chinese about 通知、失物、二手、预约、登录。";
    }

    return DEFAULT;
  }

  private static boolean containsAny(String text, String... keys) {
    for (String k : keys) {
      if (text.contains(k)) {
        return true;
      }
    }
    return false;
  }
}
