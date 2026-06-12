import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const ymd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const at = (date: Date, h: number, m = 0) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

async function main() {
  await prisma.notification.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.passTemplate.deleteMany();
  await prisma.subscription.deleteMany();

  // 示範訂閱：專業方案免費試用中（剩 5 天；示範資料有 2 間門市需專業方案）
  await prisma.subscription.create({
    data: {
      tier: "PRO",
      plan: "MONTHLY",
      status: "TRIALING",
      trialUsed: true,
      trialEndsAt: addDays(new Date(), 5),
      currentPeriodEnd: addDays(new Date(), 35),
    },
  });
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

  const store1 = await prisma.store.create({
    data: {
      name: "BeautyTime 大安旗艦店",
      phone: "02-2345-6789",
      address: "台北市大安區忠孝東路四段 100 號 2 樓",
    },
  });
  const store2 = await prisma.store.create({
    data: {
      name: "BeautyTime 信義門市",
      phone: "02-8780-1234",
      address: "台北市信義區松壽路 12 號 3 樓",
    },
  });

  const staffData = [
    { storeId: store1.id, name: "王雅婷", email: "admin@beautytime.tw", password: "admin123", role: "ADMIN", title: "品牌總監", baseSalary: 45000, serviceCommission: 0.15, productCommission: 0.08, color: "#f97316" },
    { storeId: store1.id, name: "陳思好", email: "siyu@beautytime.tw", password: "staff123", role: "STAFF", title: "髮型設計師", baseSalary: 30000, serviceCommission: 0.12, productCommission: 0.05, color: "#10b981" },
    { storeId: store1.id, name: "林佳穎", email: "jiaying@beautytime.tw", password: "staff123", role: "STAFF", title: "美甲 / 美睫師", baseSalary: 28000, serviceCommission: 0.12, productCommission: 0.05, color: "#3b82f6" },
    { storeId: store1.id, name: "張惠如", email: "huiru@beautytime.tw", password: "staff123", role: "STAFF", title: "芳療按摩師", baseSalary: 28000, serviceCommission: 0.1, productCommission: 0.05, color: "#06b6d4" },
    { storeId: store1.id, name: "李美慧", email: "meihui@beautytime.tw", password: "staff123", role: "STAFF", title: "美容師", payType: "HOURLY", baseSalary: 0, hourlyRate: 220, serviceCommission: 0.1, productCommission: 0.05, color: "#ec4899" },
    { storeId: store2.id, name: "周冠廷", email: "kuanting@beautytime.tw", password: "manager123", role: "MANAGER", title: "信義店店長 / 髮型師", baseSalary: 40000, serviceCommission: 0.13, productCommission: 0.06, color: "#0ea5e9" },
    { storeId: store2.id, name: "許芳瑜", email: "fangyu@beautytime.tw", password: "staff123", role: "STAFF", title: "美甲師", baseSalary: 28000, serviceCommission: 0.12, productCommission: 0.05, color: "#14b8a6" },
    { storeId: store2.id, name: "高子涵", email: "tzuhan@beautytime.tw", password: "staff123", role: "STAFF", title: "美容芳療師", payType: "HOURLY", baseSalary: 0, hourlyRate: 210, serviceCommission: 0.1, productCommission: 0.05, color: "#eab308" },
  ];
  const staff: { id: string; name: string; storeId: string }[] = [];
  for (const s of staffData) {
    staff.push(
      await prisma.staff.create({
        data: { ...s, password: hashPassword(s.password) },
      })
    );
  }
  const store1Staff = staff.filter((s) => s.storeId === store1.id);
  const store2Staff = staff.filter((s) => s.storeId === store2.id);

  const servicesData = [
    { name: "洗剪造型", category: "HAIR", price: 1200, durationMin: 60 },
    { name: "全頭染髮", category: "HAIR", price: 2800, durationMin: 150, depositAmount: 500 },
    { name: "燙髮造型", category: "HAIR", price: 3500, durationMin: 180, depositAmount: 500 },
    { name: "頭皮護理", category: "HAIR", price: 1500, durationMin: 60 },
    { name: "凝膠手部美甲", category: "NAIL", price: 1300, durationMin: 90 },
    { name: "足部保養美甲", category: "NAIL", price: 1500, durationMin: 90 },
    { name: "日式嫁接睫毛", category: "LASH", price: 1800, durationMin: 90, depositAmount: 300 },
    { name: "全身精油按摩 90 分", category: "SPA", price: 2200, durationMin: 90, depositAmount: 500 },
    { name: "肩頸紓壓按摩 60 分", category: "SPA", price: 1400, durationMin: 60 },
    { name: "深層清潔護膚", category: "FACIAL", price: 1800, durationMin: 75 },
    { name: "保濕煥膚課程", category: "FACIAL", price: 2500, durationMin: 90, depositAmount: 300 },
  ];
  const services: { id: string; name: string; price: number; durationMin: number; depositAmount: number }[] = [];
  for (const s of servicesData) {
    const created = await prisma.service.create({ data: s });
    services.push({ ...created });
  }

  const productsData = [
    { name: "修護洗髮精 500ml", category: "美髮", price: 880, cost: 400, stock: 24 },
    { name: "護色髮膜 200ml", category: "美髮", price: 1200, cost: 550, stock: 12 },
    { name: "玻尿酸保濕精華", category: "保養", price: 1680, cost: 700, stock: 8 },
    { name: "舒緩面膜（5 片裝）", category: "保養", price: 650, cost: 250, stock: 30 },
    { name: "指緣修護油", category: "美甲", price: 480, cost: 180, stock: 4 },
    { name: "瘦身按摩精油 100ml", category: "SPA", price: 1380, cost: 600, stock: 10 },
  ];
  const products: { id: string; name: string; price: number }[] = [];
  for (const p of productsData) products.push(await prisma.product.create({ data: p }));

  const passTemplatesData = [
    { name: "深層護膚 10 堂", totalSessions: 10, validDays: 365, price: 15000 },
    { name: "全身精油按摩 10 堂", totalSessions: 10, validDays: 365, price: 19800 },
    { name: "頭皮護理 5 堂", totalSessions: 5, validDays: 180, price: 6500 },
    { name: "肩頸紓壓 8 堂", totalSessions: 8, validDays: 180, price: 9900 },
  ];
  for (const t of passTemplatesData) await prisma.passTemplate.create({ data: t });

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
  const customers: { id: string; name: string }[] = [];
  for (const c of customersData) customers.push(await prisma.customer.create({ data: c }));

  await prisma.customerPass.create({
    data: { customerId: customers[3].id, name: "全身精油按摩 10 堂", totalSessions: 10, usedSessions: 4, expiresAt: addDays(new Date(), 200) },
  });
  await prisma.customerPass.create({
    data: { customerId: customers[0].id, name: "頭皮護理 5 堂", totalSessions: 5, usedSessions: 1, expiresAt: addDays(new Date(), 120) },
  });

  // 本週 + 下週排班（兩店）
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const shiftPattern = ["FULL", "MORNING", "EVENING", "FULL", "OFF"];
  const times: Record<string, [string, string]> = {
    MORNING: ["10:00", "16:00"],
    EVENING: ["14:00", "20:00"],
    FULL: ["10:00", "20:00"],
    OFF: ["", ""],
  };
  for (let d = 0; d < 14; d++) {
    const date = addDays(monday, d);
    for (let i = 0; i < staff.length; i++) {
      const type = d % 7 === (i + 4) % 7 ? "OFF" : shiftPattern[(i + d) % shiftPattern.length];
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
      if ((d + i) % 5 === 0) continue;
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

  // 過去 30 天銷售紀錄（依分店歸屬）
  const payMethods = ["CASH", "CARD", "CARD", "TRANSFER", "BALANCE"];
  for (let d = 30; d >= 1; d--) {
    const date = addDays(today, -d);
    for (const [storeIdx, group] of [store1Staff, store2Staff].entries()) {
      const salesCount = storeIdx === 0 ? 2 + ((d * 7) % 3) : 1 + ((d * 5) % 2);
      for (let k = 0; k < salesCount; k++) {
        const svc = services[(d + k * 3 + storeIdx) % services.length];
        const st = group[(d + k) % group.length];
        const cust = customers[(d * 2 + k + storeIdx * 3) % customers.length];
        const withProduct = (d + k) % 3 === 0;
        const prod = products[(d + k) % products.length];
        const subtotal = svc.price + (withProduct ? prod.price : 0);
        const discount = (d + k) % 5 === 0 ? 200 : 0;
        await prisma.sale.create({
          data: {
            customerId: cust.id,
            cashierId: group[0].id,
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
  }

  // 今天與未來 3 天的預約（兩店）
  const statusToday = ["COMPLETED", "CONFIRMED", "CONFIRMED", "PENDING"];
  for (let d = 0; d <= 3; d++) {
    const date = addDays(today, d);
    for (const group of [store1Staff, store2Staff]) {
      const count = group.length >= 5 ? 4 + (d % 2) : 2 + (d % 2);
      for (let k = 0; k < count; k++) {
        const svc = services[(d * 3 + k * 2) % services.length];
        const st = group[(k + d) % group.length];
        const cust = customers[(d + k * 3) % customers.length];
        const start = at(date, 10 + k * 2, 0);
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
            depositAmount: svc.depositAmount,
            depositStatus: svc.depositAmount > 0 ? "PAID" : "NONE",
            depositPaidAt: svc.depositAmount > 0 ? new Date() : null,
          },
        });
      }
    }
  }

  console.log("Seed 完成：兩間分店、8 位員工、服務、產品、顧客、排班、打卡、銷售與預約資料已建立。");
  console.log("管理者（可切換分店）：admin@beautytime.tw / admin123");
  console.log("信義店店長：kuanting@beautytime.tw / manager123");
  console.log("員工：siyu@beautytime.tw / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
