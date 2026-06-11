import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

const hash = (p: string) => createHash("sha256").update(`bs:${p}`).digest("hex");
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const at = (date: Date, h: number, m = 0) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.customerPass.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.timeRecord.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.store.deleteMany();

  const store = await prisma.store.create({
    data: {
      name: "BeauHub 美學旗艦店",
      phone: "02-2345-6789",
      address: "台北市大安區忠孝東路四段 100 號 2 樓",
      openTime: "10:00",
      closeTime: "20:00",
    },
  });

  const staffData = [
    { name: "王雅婷", email: "admin@beauhub.tw", password: "admin123", role: "ADMIN", title: "店長 / 髮型總監", baseSalary: 45000, serviceCommission: 0.15, productCommission: 0.08, color: "#f97316" },
    { name: "陳思好", email: "siyu@beauhub.tw", password: "staff123", role: "STAFF", title: "髮型設計師", baseSalary: 30000, serviceCommission: 0.12, productCommission: 0.05, color: "#10b981" },
    { name: "林佳穎", email: "jiaying@beauhub.tw", password: "staff123", role: "STAFF", title: "美甲 / 美睫師", baseSalary: 28000, serviceCommission: 0.12, productCommission: 0.05, color: "#3b82f6" },
    { name: "張惠如", email: "huiru@beauhub.tw", password: "staff123", role: "STAFF", title: "芳療按摩師", baseSalary: 28000, serviceCommission: 0.1, productCommission: 0.05, color: "#a855f7" },
    { name: "李美慧", email: "meihui@beauhub.tw", password: "staff123", role: "STAFF", title: "美容師", payType: "HOURLY", baseSalary: 0, hourlyRate: 220, serviceCommission: 0.1, productCommission: 0.05, color: "#ec4899" },
  ];
  const staff = [] as { id: string; name: string }[];
  for (const s of staffData) {
    staff.push(
      await prisma.staff.create({
        data: { ...s, password: hash(s.password), storeId: store.id },
      })
    );
  }

  const servicesData = [
    { name: "洗剪造型", category: "HAIR", price: 1200, durationMin: 60 },
    { name: "全頭染髮", category: "HAIR", price: 2800, durationMin: 150 },
    { name: "燙髮造型", category: "HAIR", price: 3500, durationMin: 180 },
    { name: "頭皮護理", category: "HAIR", price: 1500, durationMin: 60 },
    { name: "凝膠手部美甲", category: "NAIL", price: 1300, durationMin: 90 },
    { name: "足部保養美甲", category: "NAIL", price: 1500, durationMin: 90 },
    { name: "日式嫁接睫毛", category: "LASH", price: 1800, durationMin: 90 },
    { name: "全身精油按摩 90 分", category: "SPA", price: 2200, durationMin: 90 },
    { name: "肩頸紓壓按摩 60 分", category: "SPA", price: 1400, durationMin: 60 },
    { name: "深層清潔護膚", category: "FACIAL", price: 1800, durationMin: 75 },
    { name: "保濕煥膚課程", category: "FACIAL", price: 2500, durationMin: 90 },
  ];
  const services = [] as { id: string; name: string; price: number; durationMin: number }[];
  for (const s of servicesData) services.push(await prisma.service.create({ data: s }));

  const productsData = [
    { name: "修護洗髮精 500ml", category: "美髮", price: 880, cost: 400, stock: 24 },
    { name: "護色髮膜 200ml", category: "美髮", price: 1200, cost: 550, stock: 12 },
    { name: "玻尿酸保濕精華", category: "保養", price: 1680, cost: 700, stock: 8 },
    { name: "舒緩面膜（5 片裝）", category: "保養", price: 650, cost: 250, stock: 30 },
    { name: "指緣修護油", category: "美甲", price: 480, cost: 180, stock: 4 },
    { name: "瘦身按摩精油 100ml", category: "SPA", price: 1380, cost: 600, stock: 10 },
  ];
  const products = [] as { id: string; name: string; price: number }[];
  for (const p of productsData) products.push(await prisma.product.create({ data: p }));

  const customersData = [
    { name: "林小芳", phone: "0912-345-678", gender: "F", birthday: "1992-03-15", tags: "VIP,染燙客", note: "偏好自然棕色系，對 PPD 染劑輕微過敏", balance: 3000 },
    { name: "黃郁雯", phone: "0922-111-222", gender: "F", birthday: "1988-07-22", tags: "美甲常客", note: "喜歡簡約款式", balance: 0 },
    { name: "張家豪", phone: "0933-555-666", gender: "M", birthday: "1995-11-02", tags: "", note: "兩個月剪一次", balance: 0 },
    { name: "陳美玲", phone: "0955-777-888", gender: "F", birthday: "1979-01-30", tags: "VIP,SPA 會員", note: "肩頸容易痠痛，力道偏重", balance: 5600 },
    { name: "吳佩珊", phone: "0966-999-000", gender: "F", birthday: "1998-09-09", tags: "敏感肌", note: "敏感肌，避免酸類煥膚", balance: 0 },
    { name: "劉星辰", phone: "0977-123-123", gender: "F", birthday: "1990-05-18", tags: "美睫常客", note: "", balance: 1200 },
    { name: "蔡承翰", phone: "0911-234-567", gender: "M", birthday: "1985-12-25", tags: "", note: "", balance: 0 },
    { name: "鄭雅文", phone: "0988-456-789", gender: "F", birthday: "1993-08-08", tags: "新客", note: "IG 廣告導流", balance: 0 },
  ];
  const customers = [] as { id: string; name: string }[];
  for (const c of customersData) customers.push(await prisma.customer.create({ data: c }));

  await prisma.customerPass.create({
    data: { customerId: customers[3].id, name: "全身精油按摩 10 堂", totalSessions: 10, usedSessions: 4, expiresAt: addDays(new Date(), 200) },
  });
  await prisma.customerPass.create({
    data: { customerId: customers[0].id, name: "頭皮護理 5 堂", totalSessions: 5, usedSessions: 1, expiresAt: addDays(new Date(), 120) },
  });

  // 本週 + 下週排班
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const shiftPattern = ["FULL", "MORNING", "EVENING", "FULL", "OFF"];
  for (let d = 0; d < 14; d++) {
    const date = addDays(monday, d);
    for (let i = 0; i < staff.length; i++) {
      const type = d % 7 === (i + 4) % 7 ? "OFF" : shiftPattern[(i + d) % shiftPattern.length];
      const times: Record<string, [string, string]> = {
        MORNING: ["10:00", "16:00"],
        EVENING: ["14:00", "20:00"],
        FULL: ["10:00", "20:00"],
        OFF: ["", ""],
      };
      await prisma.shift.create({
        data: {
          staffId: staff[i].id,
          workDate: ymd(date),
          shiftType: type,
          startTime: times[type][0],
          endTime: times[type][1],
        },
      });
    }
  }

  // 過去 7 天打卡紀錄
  for (let d = 7; d >= 1; d--) {
    const date = addDays(today, -d);
    for (let i = 0; i < staff.length; i++) {
      if ((d + i) % 5 === 0) continue; // 模擬休假
      await prisma.timeRecord.create({
        data: {
          staffId: staff[i].id,
          workDate: ymd(date),
          clockIn: at(date, 9, 50 + ((d + i) % 10)),
          clockOut: at(date, 19, 55 + ((d * i) % 5)),
        },
      });
    }
  }

  // 過去 30 天銷售紀錄（服務 + 產品）
  const payMethods = ["CASH", "CARD", "CARD", "TRANSFER", "BALANCE"];
  for (let d = 30; d >= 1; d--) {
    const date = addDays(today, -d);
    const salesCount = 2 + ((d * 7) % 4);
    for (let k = 0; k < salesCount; k++) {
      const svc = services[(d + k * 3) % services.length];
      const st = staff[(d + k) % staff.length];
      const cust = customers[(d * 2 + k) % customers.length];
      const withProduct = (d + k) % 3 === 0;
      const prod = products[(d + k) % products.length];
      const subtotal = svc.price + (withProduct ? prod.price : 0);
      const discount = (d + k) % 5 === 0 ? 200 : 0;
      await prisma.sale.create({
        data: {
          customerId: cust.id,
          cashierId: staff[0].id,
          subtotal,
          discount,
          total: subtotal - discount,
          paymentMethod: payMethods[(d + k) % payMethods.length],
          createdAt: at(date, 11 + k * 2, 15),
          items: {
            create: [
              { staffId: st.id, itemType: "SERVICE", serviceId: svc.id, name: svc.name, unitPrice: svc.price, qty: 1, subtotal: svc.price },
              ...(withProduct
                ? [{ staffId: st.id, itemType: "PRODUCT", productId: prod.id, name: prod.name, unitPrice: prod.price, qty: 1, subtotal: prod.price }]
                : []),
            ],
          },
        },
      });
    }
  }

  // 今天與未來 3 天的預約
  const statusToday = ["COMPLETED", "CONFIRMED", "CONFIRMED", "PENDING"];
  for (let d = 0; d <= 3; d++) {
    const date = addDays(today, d);
    const count = 4 + (d % 2);
    for (let k = 0; k < count; k++) {
      const svc = services[(d * 3 + k * 2) % services.length];
      const st = staff[(k + d) % staff.length];
      const cust = customers[(d + k * 3) % customers.length];
      const startHour = 10 + k * 2;
      const start = at(date, startHour, 0);
      await prisma.appointment.create({
        data: {
          customerId: cust.id,
          staffId: st.id,
          serviceId: svc.id,
          date: ymd(date),
          startAt: start,
          endAt: new Date(start.getTime() + svc.durationMin * 60000),
          status: d === 0 ? statusToday[k % statusToday.length] : k % 3 === 0 ? "PENDING" : "CONFIRMED",
          source: k % 3 === 0 ? "ONLINE" : k % 3 === 1 ? "PHONE" : "WALK_IN",
          note: k === 0 && d === 0 ? "指定設計師" : null,
        },
      });
    }
  }

  console.log("Seed 完成：示範店家、員工、服務、產品、顧客、排班、打卡、銷售與預約資料已建立。");
  console.log("管理者登入：admin@beauhub.tw / admin123");
  console.log("員工登入：siyu@beauhub.tw / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
