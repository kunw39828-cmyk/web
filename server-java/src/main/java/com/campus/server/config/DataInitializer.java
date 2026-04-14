package com.campus.server.config;

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
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
  private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

  @Bean
  CommandLineRunner seed(
    UserAccountRepo userRepo,
    NewsItemRepo newsRepo,
    LostFoundRepo lostRepo,
    MarketItemRepo marketRepo,
    VenueRepo venueRepo,
    TeacherRepo teacherRepo,
    BookingRepo bookingRepo) {
    return args -> {
      if (userRepo.count() == 0) {
        userRepo.save(user("20260001", "张晓雨", "student", "计算机学院", true, "123456"));
        userRepo.save(user("20260002", "李明哲", "student", "信息工程学院", false, "654321"));
        userRepo.save(user("T2026001", "陈老师", "teacher", "教务处", true, "888888"));
      }
      if (newsRepo.count() == 0) {
        NewsItem n = new NewsItem();
        n.title = "图书馆延长开放通知";
        n.tag = "教务";
        n.summary = "工作日延长至22:30。";
        n.author = "教务处";
        n.date = "2026-04-10";
        newsRepo.save(n);
      }
      if (lostRepo.count() == 0) {
        LostFoundItem l = new LostFoundItem();
        l.title = "黑色双肩包（内有学生证）";
        l.place = "食堂二楼靠窗座位";
        l.date = "2026-04-11";
        l.status = "寻找中";
        l.kind = "寻物";
        l.imageUrl = "https://picsum.photos/seed/lostpack/640/480";
        l.publisherId = "20260001";
        l.publisherName = "张晓雨（学生）";
        lostRepo.save(l);
      }
      if (marketRepo.count() == 0) {
        MarketItem m = new MarketItem();
        m.title = "线性代数教材（第九版）";
        m.price = 25.0;
        m.seller = "张同学";
        m.sellerId = "20260001";
        m.campus = "本部";
        marketRepo.save(m);
      }
      if (venueRepo.count() == 0) {
        venueRepo.save(venue("v1", "报告厅 A101", "活动中心", "08:00–21:00", 200));
        venueRepo.save(venue("v2", "舞蹈练习室 3", "体育馆副楼", "09:00–20:00", 30));
        venueRepo.save(venue("v3", "研讨室 12F-05", "图书馆", "08:30–22:00", 8));
      }
      if (teacherRepo.count() == 0) {
        teacherRepo.save(teacher("t1", "陈老师", "活动中心管理办公室", List.of("v1")));
        teacherRepo.save(teacher("t2", "赵老师", "体育部场馆管理组", List.of("v2")));
        teacherRepo.save(teacher("t3", "林老师", "图书馆运行管理中心", List.of("v3")));
        teacherRepo.save(teacher("t4", "王老师", "活动中心管理办公室", List.of("v1", "v2")));
      }
      try {
        DemoBulkDataSeeder.seed(userRepo, newsRepo, lostRepo, marketRepo, venueRepo, teacherRepo, bookingRepo);
      } catch (Exception e) {
        log.error("批量演示数据写入失败（不影响服务启动，请查看下方异常）", e);
      }
      log.info(
        "演示数据已就绪：user_account={} news_item={} lost_found_item={} market_item={} venue={} teacher_approver={} booking={}",
        userRepo.count(),
        newsRepo.count(),
        lostRepo.count(),
        marketRepo.count(),
        venueRepo.count(),
        teacherRepo.count(),
        bookingRepo.count());
    };
  }

  private UserAccount user(String id, String name, String role, String dep, boolean bound, String pwd) {
    UserAccount u = new UserAccount();
    u.studentId = id;
    u.name = name;
    u.role = role;
    u.department = dep;
    u.wechatBound = bound;
    u.password = pwd;
    return u;
  }

  private Venue venue(String id, String name, String building, String open, int seats) {
    Venue v = new Venue();
    v.id = id;
    v.name = name;
    v.building = building;
    v.open = open;
    v.seats = seats;
    return v;
  }

  private TeacherApprover teacher(String id, String name, String dep, List<String> venueIds) {
    TeacherApprover t = new TeacherApprover();
    t.id = id;
    t.name = name;
    t.department = dep;
    t.managedVenueIds = venueIds;
    return t;
  }
}
