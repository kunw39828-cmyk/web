package com.campus.server.config;

import com.campus.server.entity.Booking;
import com.campus.server.entity.LostFoundItem;
import com.campus.server.entity.MarketItem;
import com.campus.server.entity.NewsItem;
import com.campus.server.entity.TeacherApprover;
import com.campus.server.entity.UserAccount;
import com.campus.server.entity.Venue;
import com.campus.server.repo.BookingRepo;
import com.campus.server.repo.LostFoundRepo;
import com.campus.server.repo.MarketItemRepo;
import com.campus.server.repo.NewsItemRepo;
import com.campus.server.repo.TeacherRepo;
import com.campus.server.repo.UserAccountRepo;
import com.campus.server.repo.VenueRepo;
import java.util.ArrayList;
import java.util.List;

/** 额外演示数据：按标题/学号等去重，可多次启动不重复插入；预约用途中含 {@link #BOOKING_MARKER} 时整批只插一次。 */
public final class DemoBulkDataSeeder {
  private static final String BOOKING_MARKER = "[演示预约数据]";

  private DemoBulkDataSeeder() {}

  public static void seed(
    UserAccountRepo userRepo,
    NewsItemRepo newsRepo,
    LostFoundRepo lostRepo,
    MarketItemRepo marketRepo,
    VenueRepo venueRepo,
    TeacherRepo teacherRepo,
    BookingRepo bookingRepo) {
    seedUsers(userRepo);
    seedVenues(venueRepo);
    seedTeachers(teacherRepo);
    seedNews(newsRepo);
    seedLostFound(lostRepo);
    seedMarket(marketRepo);
    seedBookings(bookingRepo);
  }

  private static void seedUsers(UserAccountRepo userRepo) {
    // 额外登录账号：1 个老师 + 9 个学生（仅在 DB 中不存在时插入）
    saveUserIfAbsent(userRepo, "T2026010", "教务张老师", "teacher", "教务处", true, "teach2026");
    saveUserIfAbsent(userRepo, "T2026011", "教务李老师", "teacher", "教务处", true, "teach6011");
    saveUserIfAbsent(userRepo, "T2026012", "教务王老师", "teacher", "教务处", true, "teach6012");
    saveUserIfAbsent(userRepo, "20260101", "学生01-赵一", "student", "计算机学院", true, "stu0101");
    saveUserIfAbsent(userRepo, "20260102", "学生02-钱二", "student", "信息工程学院", false, "stu0102");
    saveUserIfAbsent(userRepo, "20260103", "学生03-孙三", "student", "外国语学院", true, "stu0103");
    saveUserIfAbsent(userRepo, "20260104", "学生04-李四", "student", "经济学院", false, "stu0104");
    saveUserIfAbsent(userRepo, "20260105", "学生05-周五", "student", "法学院", true, "stu0105");
    saveUserIfAbsent(userRepo, "20260106", "学生06-吴六", "student", "管理学院", false, "stu0106");
    saveUserIfAbsent(userRepo, "20260107", "学生07-郑七", "student", "材料学院", true, "stu0107");
    saveUserIfAbsent(userRepo, "20260108", "学生08-王八", "student", "艺术学院", true, "stu0108");
    saveUserIfAbsent(userRepo, "20260109", "学生09-冯九", "student", "测试学院", false, "stu0109");

    saveUserIfAbsent(userRepo, "20260003", "王芳", "student", "外国语学院", true, "111111");
    saveUserIfAbsent(userRepo, "20260004", "刘洋", "student", "经济学院", false, "222222");
    saveUserIfAbsent(userRepo, "20260005", "周琪", "student", "计算机学院", true, "333333");
    saveUserIfAbsent(userRepo, "T2026002", "刘老师", "teacher", "学生处", true, "777777");
    saveUserIfAbsent(userRepo, "LF2026001", "失物测试号", "student", "测试学院", true, "lf123456");
  }

  private static void saveUserIfAbsent(UserAccountRepo repo, String id, String name, String role, String dep, boolean bound, String pwd) {
    if (repo.existsById(id)) {
      return;
    }
    UserAccount u = new UserAccount();
    u.studentId = id;
    u.name = name;
    u.role = role;
    u.department = dep;
    u.wechatBound = bound;
    u.password = pwd;
    repo.save(u);
  }

  private static void seedVenues(VenueRepo venueRepo) {
    saveVenueIfAbsent(venueRepo, "v4", "音乐排练厅 B201", "艺术学院楼", "10:00–18:00", 25);
    saveVenueIfAbsent(venueRepo, "v5", "室外篮球场（夜场）", "体育场", "18:00–21:00", 40);
    saveVenueIfAbsent(venueRepo, "v6", "创客空间 302", "工程训练中心", "09:00–17:30", 24);
  }

  private static void saveVenueIfAbsent(VenueRepo repo, String id, String name, String building, String open, int seats) {
    if (repo.existsById(id)) {
      return;
    }
    Venue v = new Venue();
    v.id = id;
    v.name = name;
    v.building = building;
    v.open = open;
    v.seats = seats;
    repo.save(v);
  }

  private static void seedTeachers(TeacherRepo teacherRepo) {
    saveTeacherIfAbsent(teacherRepo, "t5", "钱老师", "艺术学院场馆组", List.of("v4"));
    saveTeacherIfAbsent(teacherRepo, "t6", "孙老师", "体育部场馆组", List.of("v5"));
    saveTeacherIfAbsent(teacherRepo, "t7", "郑老师", "工训中心管理办", List.of("v6"));
    saveTeacherIfAbsent(teacherRepo, "t8", "教务李老师", "教务处审批组", List.of("v1", "v3"));
    saveTeacherIfAbsent(teacherRepo, "t9", "教务王老师", "教务处审批组", List.of("v2", "v4"));
  }

  private static void saveTeacherIfAbsent(TeacherRepo repo, String id, String name, String dep, List<String> venueIds) {
    if (repo.existsById(id)) {
      return;
    }
    TeacherApprover t = new TeacherApprover();
    t.id = id;
    t.name = name;
    t.department = dep;
    t.managedVenueIds = new ArrayList<>(venueIds);
    repo.save(t);
  }

  private static void seedNews(NewsItemRepo newsRepo) {
    addNews(newsRepo, "2026 春季学期选课时间安排", "教务", "第二轮选课于 4 月 18 日 10:00 开放，请留意学分上限。", "教务处", "2026-04-12");
    addNews(newsRepo, "宿舍区网络维护通知", "后勤", "本周五 23:00–次日 2:00 部分楼栋断网升级。", "后勤集团", "2026-04-12");
    addNews(newsRepo, "校园马拉松报名开启", "学工", "5 公里欢乐跑，报名截止 4 月 25 日。", "体育部", "2026-04-13");
    addNews(newsRepo, "实验室安全考试必修提醒", "教务", "未通过者将无法预约理工类实验课。", "实验室与设备处", "2026-04-13");
    addNews(newsRepo, "食堂新品试吃周", "后勤", "一食堂二楼窗口限时供应轻食套餐。", "饮食服务中心", "2026-04-14");
    addNews(newsRepo, "毕业生就业双选会（春季）", "就业", "4 月 20 日体育馆主馆，携带简历入场。", "就业指导中心", "2026-04-14");
    addNews(newsRepo, "图书馆数据库培训讲座", "图书馆", "介绍 CNKI / Web of Science 检索技巧。", "图书馆", "2026-04-15");
    addNews(newsRepo, "防电信诈骗专题宣传", "学工", "警惕「注销校园贷」类来电，勿转账。", "保卫处", "2026-04-15");
    addNews(newsRepo, "暑期社会实践项目征集", "团委", "重点支持乡村振兴与社区服务方向。", "校团委", "2026-04-16");
    addNews(newsRepo, "普通话水平测试报名", "教务", "本学期测试名额 800 人，先到先得。", "文学院", "2026-04-16");
    addNews(newsRepo, "校园卡挂失与补办流程更新", "后勤", "线上挂失后 24 小时内可到一卡通中心补卡。", "一卡通中心", "2026-04-17");
    addNews(newsRepo, "学术诚信与论文查重说明", "教务", "本科毕设查重比例要求详见附件。", "教务处", "2026-04-17");
  }

  private static void addNews(NewsItemRepo repo, String title, String tag, String summary, String author, String date) {
    if (repo.existsByTitle(title)) {
      return;
    }
    NewsItem n = new NewsItem();
    n.title = title;
    n.tag = tag;
    n.summary = summary;
    n.author = author;
    n.date = date;
    n.imageUrls = new ArrayList<>();
    repo.save(n);
  }

  private static void seedLostFound(LostFoundRepo lostRepo) {
    addLost(
      lostRepo,
      "AirPods 充电盒（刻字 ZQ）",
      "图书馆三楼自习区",
      "2026-04-10",
      "寻找中",
      "寻物",
      "https://picsum.photos/seed/airpods/640/480",
      "20260001",
      "张晓雨（学生）");
    addLost(
      lostRepo,
      "蓝色保温水杯（贴纸宇航员）",
      "操场看台东侧",
      "2026-04-11",
      "寻找中",
      "寻物",
      "https://picsum.photos/seed/cup/640/480",
      "20260002",
      "李明哲（学生）");
    addLost(
      lostRepo,
      "捡到：灰色毛线手套一副",
      "校车候车点",
      "2026-04-11",
      "已认领",
      "招领",
      "https://picsum.photos/seed/gloves/640/480",
      "20260003",
      "王芳（学生）");
    addLost(
      lostRepo,
      "学生卡（姓名模糊）",
      "二食堂收餐台",
      "2026-04-12",
      "寻找中",
      "寻物",
      "https://picsum.photos/seed/card/640/480",
      "20260004",
      "刘洋（学生）");
    addLost(
      lostRepo,
      "黑色折叠伞",
      "教学楼 C 座门口",
      "2026-04-12",
      "寻找中",
      "寻物",
      "https://picsum.photos/seed/umbrella/640/480",
      "20260005",
      "周琪（学生）");
    addLost(
      lostRepo,
      "捡到：红色 U 盘 32G",
      "机房 405",
      "2026-04-13",
      "寻找中",
      "招领",
      "https://picsum.photos/seed/usb/640/480",
      "20260101",
      "学生01-赵一（学生）");
    addLost(
      lostRepo,
      "眼镜盒（内有近视镜）",
      "校车 2 号线座位",
      "2026-04-13",
      "寻找中",
      "寻物",
      "https://picsum.photos/seed/glasses/640/480",
      "20260102",
      "学生02-钱二（学生）");
    addLost(
      lostRepo,
      "运动手环（表带白色）",
      "羽毛球馆更衣室",
      "2026-04-14",
      "寻找中",
      "寻物",
      "https://picsum.photos/seed/band/640/480",
      "20260103",
      "学生03-孙三（学生）");
    addLost(
      lostRepo,
      "捡到：宿舍钥匙一串（绿色挂件）",
      "快递站货架 B12",
      "2026-04-14",
      "已认领",
      "招领",
      "https://picsum.photos/seed/keys/640/480",
      "T2026001",
      "陈老师（老师）");
    addLost(
      lostRepo,
      "帆布托特包（校徽印花）",
      "咖啡厅靠窗位",
      "2026-04-15",
      "寻找中",
      "寻物",
      "https://picsum.photos/seed/bag/640/480",
      "LF2026001",
      "失物测试号（学生）");
  }

  private static void addLost(
    LostFoundRepo repo,
    String title,
    String place,
    String date,
    String status,
    String kind,
    String imageUrl,
    String publisherId,
    String publisherName) {
    if (repo.existsByTitle(title)) {
      return;
    }
    LostFoundItem l = new LostFoundItem();
    l.title = title;
    l.place = place;
    l.date = date;
    l.status = status;
    l.kind = kind;
    l.imageUrl = imageUrl;
    l.publisherId = publisherId;
    l.publisherName = publisherName;
    repo.save(l);
  }

  private static void seedMarket(MarketItemRepo marketRepo) {
    addMarket(marketRepo, "概率论与数理统计讲义（打印版）", 8.0, "王芳（学生）", "20260003", "本部");
    addMarket(marketRepo, "罗技无线鼠标 M185", 35.0, "刘洋（学生）", "20260004", "本部");
    addMarket(marketRepo, "考研英语黄皮书 2025", 40.0, "周琪（学生）", "20260005", "本部");
    addMarket(marketRepo, "宜家台灯（暖光）", 28.0, "李明哲（学生）", "20260002", "本部");
    addMarket(marketRepo, "自行车头盔 L 码", 45.0, "张晓雨（学生）", "20260001", "本部");
    addMarket(marketRepo, "显示器支架 单臂", 60.0, "陈老师（老师）", "T2026001", "本部");
    addMarket(marketRepo, "C 语言程序设计 二手书", 12.0, "王芳（学生）", "20260003", "南校区");
    addMarket(marketRepo, "小冰箱 50L（宿舍用）", 180.0, "刘洋（学生）", "20260004", "本部");
    addMarket(marketRepo, "瑜伽垫 10mm", 22.0, "周琪（学生）", "20260005", "本部");
    addMarket(marketRepo, "机械键盘 青轴（雷柏）", 95.0, "李明哲（学生）", "20260002", "本部");
  }

  private static void addMarket(MarketItemRepo repo, String title, double price, String seller, String sellerId, String campus) {
    if (repo.existsByTitleAndSeller(title, seller)) {
      return;
    }
    MarketItem m = new MarketItem();
    m.title = title;
    m.price = price;
    m.seller = seller;
    m.sellerId = sellerId;
    m.campus = campus;
    repo.save(m);
  }

  private static void seedBookings(BookingRepo bookingRepo) {
    if (bookingRepo.existsByPurposeContaining(BOOKING_MARKER)) {
      return;
    }
    bookingRepo.save(
      booking(
        "20260001",
        "t1",
        "v1",
        "报告厅 A101",
        "张晓雨（20260001）",
        "2026-04-22",
        "14:00",
        "16:00",
        "ACM 协会算法分享会 " + BOOKING_MARKER,
        "陈老师",
        "活动中心管理办公室",
        "待老师审批"));
    bookingRepo.save(
      booking(
        "20260001",
        "t1",
        "v1",
        "报告厅 A101",
        "张晓雨（20260001）",
        "2026-04-18",
        "09:00",
        "11:30",
        "团支部主题团日 " + BOOKING_MARKER,
        "陈老师",
        "活动中心管理办公室",
        "已通过"));
    bookingRepo.save(
      booking(
        "20260002",
        "t2",
        "v2",
        "舞蹈练习室 3",
        "李明哲（20260002）",
        "2026-04-23",
        "19:00",
        "20:30",
        "街舞社排练 " + BOOKING_MARKER,
        "赵老师",
        "体育部场馆管理组",
        "待老师审批"));
    bookingRepo.save(
      booking(
        "20260003",
        "t5",
        "v4",
        "音乐排练厅 B201",
        "王芳（20260003）",
        "2026-04-24",
        "15:00",
        "17:00",
        "合唱团分声部练习 " + BOOKING_MARKER,
        "钱老师",
        "艺术学院场馆组",
        "已驳回"));
    bookingRepo.save(
      booking(
        "20260004",
        "t3",
        "v3",
        "研讨室 12F-05",
        "刘洋（20260004）",
        "2026-04-25",
        "13:30",
        "15:00",
        "课程大作业小组讨论 " + BOOKING_MARKER,
        "林老师",
        "图书馆运行管理中心",
        "待老师审批"));
    bookingRepo.save(
      booking(
        "20260005",
        "t7",
        "v6",
        "创客空间 302",
        "周琪（20260005）",
        "2026-04-26",
        "10:00",
        "12:00",
        "机器人校赛赛前调试 " + BOOKING_MARKER,
        "郑老师",
        "工训中心管理办",
        "待老师审批"));
  }

  private static Booking booking(
    String ownerId,
    String teacherId,
    String venueId,
    String venueName,
    String applicant,
    String date,
    String startTime,
    String endTime,
    String purpose,
    String managerTeacher,
    String managerDepartment,
    String status) {
    Booking b = new Booking();
    b.ownerId = ownerId;
    b.teacherId = teacherId;
    b.venueId = venueId;
    b.venueName = venueName;
    b.applicant = applicant;
    b.date = date;
    b.startTime = startTime;
    b.endTime = endTime;
    b.purpose = purpose;
    b.managerTeacher = managerTeacher;
    b.managerDepartment = managerDepartment;
    b.status = status;
    return b;
  }
}
