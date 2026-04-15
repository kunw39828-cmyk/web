package com.campus.server.controller;

import com.campus.server.entity.Booking;
import com.campus.server.entity.LostFoundChatMessage;
import com.campus.server.entity.LostFoundItem;
import com.campus.server.entity.MarketChatMessage;
import com.campus.server.entity.MarketItem;
import com.campus.server.entity.NewsItem;
import com.campus.server.entity.TeacherApprover;
import com.campus.server.entity.UserAccount;
import com.campus.server.entity.Venue;
import com.campus.server.repo.BookingRepo;
import com.campus.server.repo.LostFoundChatRepo;
import com.campus.server.repo.LostFoundRepo;
import com.campus.server.repo.MarketChatRepo;
import com.campus.server.repo.MarketItemRepo;
import com.campus.server.repo.NewsItemRepo;
import com.campus.server.repo.TeacherRepo;
import com.campus.server.repo.UserAccountRepo;
import com.campus.server.repo.VenueRepo;
import com.campus.server.service.JwtService;
import com.campus.server.service.WebPushService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ApiController {
  private final UserAccountRepo userRepo;
  private final NewsItemRepo newsRepo;
  private final LostFoundRepo lostRepo;
  private final LostFoundChatRepo lostFoundChatRepo;
  private final MarketChatRepo marketChatRepo;
  private final MarketItemRepo marketRepo;
  private final VenueRepo venueRepo;
  private final TeacherRepo teacherRepo;
  private final BookingRepo bookingRepo;
  private final JwtService jwtService;
  private final WebPushService webPushService;

  public ApiController(
 UserAccountRepo userRepo,
    NewsItemRepo newsRepo,
    LostFoundRepo lostRepo,
    LostFoundChatRepo lostFoundChatRepo,
    MarketChatRepo marketChatRepo,
    MarketItemRepo marketRepo,
    VenueRepo venueRepo,
    TeacherRepo teacherRepo,
    BookingRepo bookingRepo,
    JwtService jwtService,
    WebPushService webPushService) {
    this.userRepo = userRepo;
    this.newsRepo = newsRepo;
    this.lostRepo = lostRepo;
    this.lostFoundChatRepo = lostFoundChatRepo;
    this.marketChatRepo = marketChatRepo;
    this.marketRepo = marketRepo;
    this.venueRepo = venueRepo;
    this.teacherRepo = teacherRepo;
    this.bookingRepo = bookingRepo;
    this.jwtService = jwtService;
    this.webPushService = webPushService;
  }

  @GetMapping("/health")
  public Map<String, Boolean> health() { return Map.of("ok", true); }

  @PostMapping("/auth/password-login")
  public Map<String, Object> passwordLogin(@RequestBody Map<String, String> body) {
    var user = userRepo.findById(body.getOrDefault("studentId", "").trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "学号或密码错误。"));
    if (!user.password.equals(body.get("password"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "学号或密码错误。");
    return Map.of("token", jwtService.issue(user.studentId, user.role), "user", user);
  }

  @PostMapping("/auth/change-password")
  public Map<String, Object> changePassword(@RequestHeader("Authorization") String auth, @RequestBody Map<String, String> body) {
    String studentId = jwtService.parseStudentId(auth);
    var user = userRepo.findById(studentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "账号不存在。"));
    String oldPwd = body.getOrDefault("oldPassword", "");
    String newPwd = body.getOrDefault("newPassword", "");
    if (oldPwd.isBlank() || newPwd.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请填写原密码与新密码。");
    if (!user.password.equals(oldPwd)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "原密码错误。");
    if (newPwd.length() < 6) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码至少 6 位。");
    if (newPwd.equals(oldPwd)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码不能与原密码相同。");
    user.password = newPwd;
    user.mustChangePassword = false;
    userRepo.save(user);
    return Map.of("ok", true, "user", user);
  }

  @PostMapping("/auth/forgot-password")
  public Map<String, Object> forgotPassword(@RequestBody Map<String, String> body) {
    String sid = body.getOrDefault("studentId", "").trim();
    String name = body.getOrDefault("name", "").trim();
    String idLast4 = body.getOrDefault("idCardLast4", "").trim();
    if (sid.isBlank() || name.isBlank() || idLast4.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请填写学号、姓名与身份证后四位。");
    }
    if (!idLast4.matches("\\d{4}")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "身份证后四位格式不正确。");
    }
    var user = userRepo.findById(sid).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "未找到该学号。"));
    if (user.name == null || !user.name.trim().equals(name)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "学号或姓名不匹配。");
    }
    if (user.idCardLast4 == null || !user.idCardLast4.trim().equals(idLast4)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "学号、姓名或身份证后四位不匹配。");
    }
    // 重置为学校配发初始密码（演示：固定为 123456），并强制下次登录修改
    user.password = "123456";
    user.mustChangePassword = true;
    userRepo.save(user);
    return Map.of("ok", true);
  }

  @GetMapping("/news")
  public List<NewsItem> listNews() { return newsRepo.findAll(); }

  @PostMapping("/news")
  public NewsItem createNews(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> body) {
    var user = mustUser(auth);
    if (!"teacher".equals(user.role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "仅老师可发布通知。");
    NewsItem item = new NewsItem();
    item.title = String.valueOf(body.getOrDefault("title", "")).trim();
    item.summary = String.valueOf(body.getOrDefault("summary", "")).trim();
    // 只允许发布「教务」类通知
    item.tag = "教务";
    item.author = user.name;
    item.date = LocalDate.now().toString();
    Object imgs = body.get("imageUrls");
    if (imgs instanceof List<?> list) item.imageUrls = list.stream().map(String::valueOf).toList();
    if (item.title.isBlank() || item.summary.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "标题和摘要必填。");
    return newsRepo.save(item);
  }

  @GetMapping("/lost-found")
  public List<LostFoundItem> listLost(
    @RequestParam(required = false) String keyword,
    @RequestParam(required = false) String kind) {
    String kw = keyword == null ? "" : keyword.trim();
    String kd = kind == null ? "" : kind.trim();
    Stream<LostFoundItem> stream = lostRepo.findAll().stream();
    if (!kd.isEmpty()) {
      stream = stream.filter(i -> kd.equals(normalizeLostKind(i)));
    }
    if (!kw.isEmpty()) {
      stream =
        stream.filter(
          i ->
            (i.title != null && i.title.contains(kw))
              || (i.place != null && i.place.contains(kw))
              || (i.publisherName != null && i.publisherName.contains(kw))
              || (i.publisherId != null && i.publisherId.contains(kw)));
    }
    return stream.toList();
  }

  @PostMapping("/lost-found")
  public LostFoundItem createLost(@RequestHeader("Authorization") String auth, @RequestBody Map<String, String> body) {
    var user = mustUser(auth);
    LostFoundItem item = new LostFoundItem();
    item.publisherId = user.studentId;
    item.publisherName = user.name + ("teacher".equals(user.role) ? "（老师）" : "（学生）");
    item.title = body.getOrDefault("title", "").trim();
    item.place = body.getOrDefault("place", "").trim();
    item.status = body.getOrDefault("status", "寻找中");
    String k = body.getOrDefault("kind", "寻物").trim();
    if (!"寻物".equals(k) && !"招领".equals(k)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "分类须为「寻物」或「招领」。");
    }
    item.kind = k;
    item.imageUrl = body.get("imageUrl");
    item.date = LocalDate.now().toString();
    if (item.title.isBlank() || item.place.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "物品名称和地点必填。");
    return lostRepo.save(item);
  }

  private static String normalizeLostKind(LostFoundItem i) {
    if (i.kind == null || i.kind.isBlank()) {
      return "寻物";
    }
    return i.kind;
  }

  @GetMapping("/lost-found/chat/sessions")
  public List<Map<String, Object>> lostFoundChatSessions(@RequestHeader("Authorization") String auth) {
    var me = mustUser(auth);
    var all = lostFoundChatRepo.findByFromIdOrToIdOrderByIdDesc(me.studentId, me.studentId);
    Map<String, Map<String, Object>> sessions = new LinkedHashMap<>();
    for (var m : all) {
      String peerId = m.fromId.equals(me.studentId) ? m.toId : m.fromId;
      String key = m.lostFoundItemId + ":" + peerId;
      Map<String, Object> s = sessions.get(key);
      if (s == null) {
        String peerName = userRepo.findById(peerId).map(u -> u.name).orElse(peerId);
        String itemTitle = lostRepo.findById(m.lostFoundItemId).map(i -> i.title).orElse("启事已删除");
        int unread = (m.toId.equals(me.studentId) && !m.readFlag) ? 1 : 0;
        s = new HashMap<>();
        s.put("itemId", m.lostFoundItemId);
        s.put("peerId", peerId);
        s.put("peerName", peerName);
        s.put("itemTitle", itemTitle);
        s.put("lastContent", "image".equals(m.messageType) ? "[图片]" : m.content);
        s.put("lastAt", m.createdAt);
        s.put("unread", unread);
        sessions.put(key, s);
      } else if (m.toId.equals(me.studentId) && !m.readFlag) {
        int unread = (int) s.getOrDefault("unread", 0);
        s.put("unread", unread + 1);
      }
    }
    return new ArrayList<>(sessions.values());
  }

  @GetMapping("/lost-found/{id}/chat")
  public List<Map<String, Object>> listLostFoundChat(
    @RequestHeader("Authorization") String auth,
    @PathVariable Long id,
    @RequestParam(required = false) String peerId,
    @RequestParam(required = false) String peerName) {
    var me = mustUser(auth);
    var post = lostRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "启事不存在。"));
    String otherId = resolveLostFoundPeerId(post, me.studentId, peerId, peerName);
    if (otherId.equals(me.studentId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能和自己聊天。");
    var list = lostFoundChatRepo.findConversation(id, me.studentId, otherId);
    List<LostFoundChatMessage> changed = new ArrayList<>();
    for (var m : list) {
      if (me.studentId.equals(m.toId) && !m.readFlag) {
        m.readFlag = true;
        changed.add(m);
      }
    }
    if (!changed.isEmpty()) {
      lostFoundChatRepo.saveAll(changed);
    }
    return list.stream()
      .map(
        m ->
          Map.<String, Object>of(
            "id",
            m.id,
            "itemId",
            m.lostFoundItemId,
            "fromId",
            m.fromId,
            "toId",
            m.toId,
            "content",
            m.content,
            "createdAt",
            m.createdAt,
            "read",
            m.readFlag,
            "type",
            m.messageType,
            "deleted",
            m.deletedFlag))
      .toList();
  }

  @PostMapping("/lost-found/{id}/chat")
  public Map<String, Object> sendLostFoundChat(
    @RequestHeader("Authorization") String auth,
    @PathVariable Long id,
    @RequestBody Map<String, String> body) {
    var me = mustUser(auth);
    var post = lostRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "启事不存在。"));
    String otherId = resolveLostFoundPeerId(post, me.studentId, body.get("peerId"), body.get("peerName"));
    if (otherId.equals(me.studentId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能和自己聊天。");
    String type = body.getOrDefault("type", "text").trim();
    if (!"text".equals(type) && !"image".equals(type)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息类型不支持。");
    }
    String text = body.getOrDefault("content", "").trim();
    if (text.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息不能为空。");
    if ("image".equals(type) && !text.startsWith("data:image/")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "图片消息格式非法。");
    }
    LostFoundChatMessage msg = new LostFoundChatMessage();
    msg.lostFoundItemId = post.id;
    msg.fromId = me.studentId;
    msg.toId = otherId;
    msg.content = text;
    msg.createdAt = LocalDateTime.now().toString();
    msg.readFlag = false;
    msg.messageType = type;
    msg.deletedFlag = false;
    var saved = lostFoundChatRepo.save(msg);
    webPushService.notifyLostFoundMessage(saved, me, post);
    return Map.of(
      "id",
      saved.id,
      "itemId",
      saved.lostFoundItemId,
      "fromId",
      saved.fromId,
      "toId",
      saved.toId,
      "content",
      saved.content,
      "createdAt",
      saved.createdAt,
      "read",
      saved.readFlag,
      "type",
      saved.messageType,
      "deleted",
      saved.deletedFlag);
  }

  @PostMapping("/lost-found/chat/{messageId}/revoke")
  public Map<String, Object> revokeLostFoundChat(
    @RequestHeader("Authorization") String auth,
    @PathVariable Long messageId) {
    var me = mustUser(auth);
    var msg =
      lostFoundChatRepo
        .findById(messageId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "消息不存在。"));
    if (!me.studentId.equals(msg.fromId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能撤回自己发送的消息。");
    }
    if (msg.deletedFlag) {
      return Map.of("ok", true, "already", true);
    }
    LocalDateTime sentAt;
    try {
      sentAt = LocalDateTime.parse(msg.createdAt);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息时间格式异常，无法撤回。");
    }
    if (sentAt.plusMinutes(2).isBefore(LocalDateTime.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "仅支持发送后 2 分钟内撤回。");
    }
    msg.deletedFlag = true;
    msg.content = "你撤回了一条消息";
    msg.messageType = "text";
    lostFoundChatRepo.save(msg);
    return Map.of("ok", true);
  }

  @GetMapping("/market")
  public List<MarketItem> listMarket() { return marketRepo.findAll(); }

  @PostMapping("/market")
  public MarketItem createMarket(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> body) {
    var user = mustUser(auth);
    String title = String.valueOf(body.getOrDefault("title", "")).trim();
    double price = Double.parseDouble(String.valueOf(body.getOrDefault("price", "0")));
    if (title.isBlank() || price <= 0.01) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "商品名称必填且价格需大于 0.01。");
    MarketItem item = new MarketItem();
    item.title = title;
    item.price = price;
    item.campus = String.valueOf(body.getOrDefault("campus", "本部"));
    item.seller = user.name + ("teacher".equals(user.role) ? "（老师）" : "（学生）");
    item.sellerId = user.studentId;
    return marketRepo.save(item);
  }

  @PostMapping("/market/{id}/buy")
  public Map<String, String> buy(@RequestHeader("Authorization") String auth, @PathVariable Long id) {
    var user = mustUser(auth);
    var item = marketRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "商品不存在。"));
    return Map.of("message", user.name + " 已购买「" + item.title + "」。");
  }

  @GetMapping("/market/chat/sessions")
  public List<Map<String, Object>> marketChatSessions(@RequestHeader("Authorization") String auth) {
    var me = mustUser(auth);
    var all = marketChatRepo.findByFromIdOrToIdOrderByIdDesc(me.studentId, me.studentId);
    Map<String, Map<String, Object>> sessions = new LinkedHashMap<>();
    for (var m : all) {
      String peerId = m.fromId.equals(me.studentId) ? m.toId : m.fromId;
      String key = m.itemId + ":" + peerId;
      Map<String, Object> s = sessions.get(key);
      if (s == null) {
        String peerName = userRepo.findById(peerId).map(u -> u.name).orElse(peerId);
        String itemTitle = marketRepo.findById(m.itemId).map(i -> i.title).orElse("商品已下架");
        int unread = (m.toId.equals(me.studentId) && !m.readFlag) ? 1 : 0;
        s = new HashMap<>();
        s.put("itemId", m.itemId);
        s.put("peerId", peerId);
        s.put("peerName", peerName);
        s.put("itemTitle", itemTitle);
        s.put("lastContent", "image".equals(m.messageType) ? "[图片]" : m.content);
        s.put("lastAt", m.createdAt);
        s.put("unread", unread);
        sessions.put(key, s);
      } else if (m.toId.equals(me.studentId) && !m.readFlag) {
        int unread = (int) s.getOrDefault("unread", 0);
        s.put("unread", unread + 1);
      }
    }
    return new ArrayList<>(sessions.values());
  }

  @GetMapping("/market/{id}/chat")
  public List<Map<String, Object>> listMarketChat(
    @RequestHeader("Authorization") String auth,
    @PathVariable Long id,
    @RequestParam(required = false) String peerId,
    @RequestParam(required = false) String peerName) {
    var me = mustUser(auth);
    var item = marketRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "商品不存在。"));
    String otherId = resolveMarketPeerId(item, me.studentId, peerId, peerName);
    if (otherId.equals(me.studentId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能和自己聊天。");
    var list = marketChatRepo.findConversation(item.id, me.studentId, otherId);
    // 拉取会话即视为已读
    List<MarketChatMessage> changed = new ArrayList<>();
    for (var m : list) {
      if (me.studentId.equals(m.toId) && !m.readFlag) {
        m.readFlag = true;
        changed.add(m);
      }
    }
    if (!changed.isEmpty()) {
      marketChatRepo.saveAll(changed);
    }
    return list.stream().map(m -> Map.<String, Object>of(
      "id", m.id,
      "itemId", m.itemId,
      "fromId", m.fromId,
      "toId", m.toId,
      "content", m.content,
      "createdAt", m.createdAt,
      "read", m.readFlag,
      "type", m.messageType,
      "deleted", m.deletedFlag
    )).toList();
  }

  @PostMapping("/market/{id}/chat")
  public Map<String, Object> sendMarketChat(
    @RequestHeader("Authorization") String auth,
    @PathVariable Long id,
    @RequestBody Map<String, String> body) {
    var me = mustUser(auth);
    var item = marketRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "商品不存在。"));
    String otherId = resolveMarketPeerId(item, me.studentId, body.get("peerId"), body.get("peerName"));
    if (otherId.equals(me.studentId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能和自己聊天。");
    String type = body.getOrDefault("type", "text").trim();
    if (!"text".equals(type) && !"image".equals(type)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息类型不支持。");
    }
    String text = body.getOrDefault("content", "").trim();
    if (text.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息不能为空。");
    if ("image".equals(type) && !text.startsWith("data:image/")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "图片消息格式非法。");
    }
    MarketChatMessage msg = new MarketChatMessage();
    msg.itemId = item.id;
    msg.fromId = me.studentId;
    msg.toId = otherId;
    msg.content = text;
    msg.createdAt = LocalDateTime.now().toString();
    msg.readFlag = false;
    msg.messageType = type;
    msg.deletedFlag = false;
    var saved = marketChatRepo.save(msg);
    webPushService.notifyMarketMessage(saved, me, item);
    return Map.of(
      "id", saved.id,
      "itemId", saved.itemId,
      "fromId", saved.fromId,
      "toId", saved.toId,
      "content", saved.content,
      "createdAt", saved.createdAt,
      "read", saved.readFlag,
      "type", saved.messageType,
      "deleted", saved.deletedFlag);
  }

  @PostMapping("/market/chat/{messageId}/revoke")
  public Map<String, Object> revokeMarketChat(
    @RequestHeader("Authorization") String auth,
    @PathVariable Long messageId) {
    var me = mustUser(auth);
    var msg = marketChatRepo.findById(messageId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "消息不存在。"));
    if (!me.studentId.equals(msg.fromId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能撤回自己发送的消息。");
    }
    if (msg.deletedFlag) {
      return Map.of("ok", true, "already", true);
    }
    LocalDateTime sentAt;
    try {
      sentAt = LocalDateTime.parse(msg.createdAt);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息时间格式异常，无法撤回。");
    }
    if (sentAt.plusMinutes(2).isBefore(LocalDateTime.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "仅支持发送后 2 分钟内撤回。");
    }
    msg.deletedFlag = true;
    msg.content = "你撤回了一条消息";
    msg.messageType = "text";
    marketChatRepo.save(msg);
    return Map.of("ok", true);
  }

  @GetMapping("/venues")
  public List<Venue> venues() { return venueRepo.findAll(); }

  @GetMapping("/teachers")
  public List<TeacherApprover> teachers(@RequestParam(required = false) String venueId) {
    if (venueId == null || venueId.isBlank()) {
      return teacherRepo.findAll();
    }
    return teacherRepo.findByManagedVenueIdsContaining(venueId);
  }

  @GetMapping("/bookings")
  public List<Booking> myBookings(@RequestHeader("Authorization") String auth) {
    var user = mustUser(auth);
    return bookingRepo.findByOwnerIdOrderByIdDesc(user.studentId);
  }

  @PostMapping("/bookings")
  public Booking createBooking(@RequestHeader("Authorization") String auth, @RequestBody Map<String, String> body) {
    var user = mustUser(auth);
    var venue = venueRepo.findById(body.get("venueId")).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "场馆不存在。"));
    var teacher = teacherRepo.findById(body.get("teacherId")).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "审批老师不存在。"));
    if (!teacher.managedVenueIds.contains(venue.id)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "老师不负责该场馆审批。");
    Booking booking = new Booking();
    booking.ownerId = user.studentId;
    booking.teacherId = teacher.id;
    booking.venueId = venue.id;
    booking.venueName = venue.name;
    booking.applicant = user.name + "（" + user.studentId + "）";
    booking.date = body.get("date");
    booking.startTime = body.get("startTime");
    booking.endTime = body.get("endTime");
    booking.purpose = body.get("purpose");
    booking.managerTeacher = teacher.name;
    booking.managerDepartment = teacher.department;
    booking.status = "待老师审批";
    return bookingRepo.save(booking);
  }

  @GetMapping("/approvals/pending")
  public List<Booking> pending(@RequestHeader("Authorization") String auth) {
    var user = mustUser(auth);
    if (!"teacher".equals(user.role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "仅老师可查看审批列表。");
    var teacherIds = teacherRepo.findByName(user.name).stream().map(t -> t.id).toList();
    return bookingRepo.findByTeacherIdInAndStatusOrderByIdDesc(teacherIds, "待老师审批");
  }

  @PostMapping("/approvals/{id}/decision")
  public Booking decision(@RequestHeader("Authorization") String auth, @PathVariable Long id, @RequestBody Map<String, String> body) {
    var user = mustUser(auth);
    if (!"teacher".equals(user.role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "仅老师可处理审批。");
    Booking booking = bookingRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "预约申请不存在。"));
    var teacherIds = teacherRepo.findByName(user.name).stream().map(t -> t.id).toList();
    if (!teacherIds.contains(booking.teacherId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "该申请不属于当前老师审批。");
    booking.status = "approve".equals(body.get("decision")) ? "已通过" : "已驳回";
    return bookingRepo.save(booking);
  }

  private UserAccount mustUser(String authHeader) {
    String studentId = jwtService.parseStudentId(authHeader);
    return userRepo.findById(studentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录状态失效。"));
  }

  private String resolvePeerId(String peerId, String peerName) {
    if (peerId != null && !peerId.isBlank()) {
      return userRepo.findById(peerId.trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "对方账号不存在。"))
        .studentId;
    }
    String name = peerName == null ? "" : peerName.trim();
    if (name.endsWith("（老师）") || name.endsWith("（学生）")) {
      name = name.substring(0, name.length() - 4);
    }
    if (name.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "缺少联系对象。");
    return userRepo.findFirstByName(name)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "未找到对应卖家账号。"))
      .studentId;
  }

  private String resolveMarketPeerId(MarketItem item, String meId, String peerId, String peerName) {
    if (peerId != null && !peerId.isBlank()) {
      return resolvePeerId(peerId, peerName);
    }
    if (item.sellerId != null && !item.sellerId.isBlank() && !item.sellerId.equals(meId)) {
      return item.sellerId;
    }
    return resolvePeerId(peerId, peerName);
  }

  private String resolveLostFoundPeerId(LostFoundItem post, String meId, String peerId, String peerName) {
    if (peerId != null && !peerId.isBlank()) {
      return resolvePeerId(peerId, peerName);
    }
    if (post.publisherId != null && !post.publisherId.isBlank() && !post.publisherId.equals(meId)) {
      return post.publisherId;
    }
    return resolvePeerId(peerId, peerName);
  }

}
