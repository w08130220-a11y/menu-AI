import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";

const sans = readFileSync("/tmp/NotoSansTC.otf");
const sansBold = readFileSync("/tmp/NotoSansTC-Bold.otf");
const serifBold = readFileSync("/tmp/NotoSerifTC-Bold.otf");

const h = (type, style = {}, ...children) => ({
  type,
  props: {
    style: { display: "flex", ...style },
    children:
      children.length === 0
        ? undefined
        : children.length === 1
          ? children[0]
          : children,
  },
});
const t = (text, style) => ({ type: "div", props: { style, children: text } });

const THEMES = {
  bw: {
    name: "黑白極簡編輯風",
    pageBg: "#ffffff",
    text: "#101010",
    sub: "#8a8a8a",
    cardBg: "#ffffff",
    cardBorder: "#e4e4e4",
    sideBg: "#0c0c0c",
    sideText: "rgba(255,255,255,0.62)",
    sideTextActive: "#ffffff",
    sideActiveBg: "rgba(255,255,255,0.10)",
    sideLabel: "rgba(255,255,255,0.32)",
    brandAccent: "#bdbdbd",
    primary: "#111111",
    barMain: "#1a1a1a",
    barSoft: "#c9c9c9",
    good: "#111111",
    chipBg: "#f3f3f3",
    statusWork: { bg: "#111111", fg: "#ffffff" },
    statusOff: { bg: "#ededed", fg: "#8a8a8a" },
  },
  violet: {
    name: "深紫羅蘭",
    pageBg: "#faf8fd",
    text: "#1d1430",
    sub: "#8d83a3",
    cardBg: "#ffffff",
    cardBorder: "#e9e3f4",
    sideBg: "#170b2b",
    sideText: "rgba(235,228,250,0.62)",
    sideTextActive: "#d8c9ff",
    sideActiveBg: "rgba(167,139,250,0.16)",
    sideLabel: "rgba(235,228,250,0.30)",
    brandAccent: "#a78bfa",
    primary: "#5b21b6",
    barMain: "#6d28d9",
    barSoft: "#ddd2f5",
    good: "#7c3aed",
    chipBg: "#f3eefc",
    statusWork: { bg: "#ede7fb", fg: "#6d28d9" },
    statusOff: { bg: "#f0eef5", fg: "#9a8fb5" },
  },
};

const trend = [42, 55, 38, 61, 47, 70, 52, 44, 66, 58, 49, 75, 62, 12];
const days = ["5/30","5/31","6/1","6/2","6/3","6/4","6/5","6/6","6/7","6/8","6/9","6/10","6/11","6/12"];
const pays = [["刷卡", 47, "NT$ 51,040"],["儲值金", 20, "NT$ 21,600"],["轉帳", 18, "NT$ 19,300"],["現金", 15, "NT$ 16,400"]];
const rank = [["#1 陳思好", 100, "NT$ 17,640"],["#2 林佳穎", 84, "NT$ 14,760"],["#3 李美慧", 83, "NT$ 14,750"],["#4 張惠如", 81, "NT$ 14,350"],["#5 許芳瑜", 75, "NT$ 13,300"]];
const onduty = [["王","王雅婷","10:00-20:00","上班中"],["陳","陳思好","10:00-16:00","上班中"],["林","林佳穎","14:00-20:00","未打卡"],["張","張惠如","11:30-18:30","上班中"],["李","李美慧","10:00-20:00","已下班"]];

function statCard(T, label, value, sub) {
  return h("div", { display: "flex", flexDirection: "column", flex: 1, background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "18px 20px" },
    t(label, { fontSize: 13, color: T.sub }),
    t(value, { fontSize: 26, fontWeight: 700, color: T.text, marginTop: 8, fontFamily: "serif" }),
    t(sub, { fontSize: 11, color: T.sub, marginTop: 6 })
  );
}

function navItem(T, label, active = false) {
  return h("div", { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, background: active ? T.sideActiveBg : "transparent", color: active ? T.sideTextActive : T.sideText, fontSize: 13, fontWeight: active ? 700 : 400 },
    h("div", { width: 13, height: 13, borderRadius: 4, border: `1.6px solid ${active ? T.sideTextActive : T.sideText}` }),
    t(label, {})
  );
}

function navGroup(T, title, items, activeIdx = -1) {
  return h("div", { display: "flex", flexDirection: "column", marginBottom: 14 },
    t(title, { fontSize: 10, color: T.sideLabel, letterSpacing: 2, padding: "0 10px", marginBottom: 4 }),
    ...items.map((label, i) => navItem(T, label, i === activeIdx))
  );
}

function dashboard(T) {
  return h("div", { display: "flex", width: 1440, height: 980, background: T.pageBg, fontFamily: "sans" },
    // 側邊欄
    h("div", { display: "flex", flexDirection: "column", width: 232, background: T.sideBg, padding: "20px 12px" },
      h("div", { display: "flex", alignItems: "baseline", gap: 2, padding: "0 10px", marginBottom: 6 },
        t("Beauty", { fontFamily: "serif", fontSize: 20, fontWeight: 700, color: "#ffffff" }),
        t("Time", { fontFamily: "serif", fontSize: 20, fontWeight: 700, color: T.brandAccent })
      ),
      t("全部分店", { fontSize: 10, color: T.sideLabel, padding: "0 10px", marginBottom: 16 }),
      navGroup(T, "日常營運", ["儀表板", "預約管理", "POS 收款", "上下班打卡", "LINE 通知"], 0),
      navGroup(T, "顧客", ["顧客管理"]),
      navGroup(T, "團隊", ["員工排班", "業績紀錄", "薪資計算", "員工管理"]),
      navGroup(T, "店務設定", ["跨店報表", "服務項目", "產品庫存", "訂閱方案"]),
      h("div", { display: "flex", flexDirection: "column", marginTop: "auto", borderTop: `1px solid ${T.sideActiveBg}`, paddingTop: 12, paddingLeft: 10 },
        t("王雅婷", { fontSize: 13, color: "#fff", fontWeight: 700 }),
        t("品牌總監", { fontSize: 11, color: T.sideLabel, marginTop: 2 })
      )
    ),
    // 主內容
    h("div", { display: "flex", flexDirection: "column", flex: 1, padding: "26px 30px" },
      t("公司儀表板", { fontSize: 24, fontWeight: 700, color: T.text, fontFamily: "serif" }),
      t("2026 年 6 月 12 日・營運總覽", { fontSize: 12, color: T.sub, marginTop: 4 }),
      // 統計卡
      h("div", { display: "flex", gap: 14, marginTop: 18 },
        statCard(T, "今日營收", "NT$ 12,840", "6 筆結帳"),
        statCard(T, "本月營收", "NT$ 108,340", "51 筆結帳"),
        statCard(T, "今日預約", "6 筆", "1 筆待確認"),
        statCard(T, "今日出勤", "4 / 8 人", "本月新客 8 位")
      ),
      // 今日上班人員
      h("div", { display: "flex", flexDirection: "column", background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "16px 20px", marginTop: 14 },
        t("今日上班人員（5 位排班）", { fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }),
        h("div", { display: "flex", gap: 10 },
          ...onduty.map(([init, name, time, status]) =>
            h("div", { display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.cardBorder}`, borderRadius: 9, padding: "8px 12px" },
              h("div", { display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 99, background: T.primary, color: "#fff", fontSize: 12, fontWeight: 700 }, init),
              h("div", { display: "flex", flexDirection: "column" },
                t(name, { fontSize: 12, fontWeight: 700, color: T.text }),
                t(time, { fontSize: 10, color: T.sub })
              ),
              t(status, { fontSize: 10, padding: "2px 8px", borderRadius: 99, background: status === "上班中" ? T.statusWork.bg : T.statusOff.bg, color: status === "上班中" ? T.statusWork.fg : T.statusOff.fg, fontWeight: 700 })
            )
          )
        )
      ),
      // 圖表列
      h("div", { display: "flex", gap: 14, marginTop: 14 },
        h("div", { display: "flex", flexDirection: "column", flex: 2, background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "16px 20px" },
          t("近 14 天營收趨勢", { fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }),
          h("div", { display: "flex", alignItems: "flex-end", gap: 8, height: 150 },
            ...trend.map((v, i) =>
              h("div", { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 5 },
                h("div", { width: "100%", height: v * 1.7, background: i === trend.length - 1 ? T.barSoft : T.barMain, borderRadius: "4px 4px 0 0" }),
                t(days[i], { fontSize: 9, color: T.sub })
              )
            )
          )
        ),
        h("div", { display: "flex", flexDirection: "column", flex: 1, background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "16px 20px" },
          t("本月付款方式占比", { fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }),
          ...pays.map(([label, pct, amt]) =>
            h("div", { display: "flex", flexDirection: "column", marginBottom: 12 },
              h("div", { display: "flex", justifyContent: "space-between", marginBottom: 5 },
                t(label, { fontSize: 12, color: T.text }),
                t(`${pct}%・${amt}`, { fontSize: 11, color: T.sub })
              ),
              h("div", { display: "flex", width: "100%", height: 7, background: T.barSoft, borderRadius: 99 },
                h("div", { width: `${pct * 2}%`, height: 7, background: T.barMain, borderRadius: 99 })
              )
            )
          )
        )
      ),
      // 預約 + 排行
      h("div", { display: "flex", gap: 14, marginTop: 14 },
        h("div", { display: "flex", flexDirection: "column", flex: 2, background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "16px 20px" },
          t("今日預約", { fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }),
          ...[["10:00", "林小芳", "洗剪造型・王雅婷", "已完成"], ["12:00", "陳美玲", "燙髮造型・陳思好", "已確認"], ["14:00", "蔡承翰", "凝膠手部美甲・林佳穎", "已確認"], ["16:00", "黃郁雯", "日式嫁接睫毛・張惠如", "待確認"]].map(([time, name, svc, st]) =>
            h("div", { display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${T.cardBorder}` },
              t(time, { fontSize: 13, color: T.sub, width: 44 }),
              t(name, { fontSize: 13, fontWeight: 700, color: T.text, width: 64 }),
              t(svc, { fontSize: 12, color: T.sub, flex: 1 }),
              t(st, { fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: st === "待確認" ? T.chipBg : T.statusWork.bg, color: st === "待確認" ? T.sub : T.statusWork.fg })
            )
          )
        ),
        h("div", { display: "flex", flexDirection: "column", flex: 1, background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "16px 20px" },
          t("本月員工業績排行", { fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }),
          ...rank.map(([name, pct, amt]) =>
            h("div", { display: "flex", flexDirection: "column", marginBottom: 11 },
              h("div", { display: "flex", justifyContent: "space-between", marginBottom: 4 },
                t(name, { fontSize: 12, color: T.text }),
                t(amt, { fontSize: 12, fontWeight: 700, color: T.text })
              ),
              h("div", { display: "flex", width: "100%", height: 7, background: T.barSoft, borderRadius: 99 },
                h("div", { width: `${pct}%`, height: 7, background: T.barMain, borderRadius: 99 })
              )
            )
          )
        )
      )
    )
  );
}

const fonts = [
  { name: "sans", data: sans, weight: 400, style: "normal" },
  { name: "sans", data: sansBold, weight: 700, style: "normal" },
  { name: "serif", data: serifBold, weight: 700, style: "normal" },
];

for (const [key, T] of Object.entries(THEMES)) {
  const svg = await satori(dashboard(T), { width: 1440, height: 980, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1440 } }).render().asPng();
  writeFileSync(`/tmp/dashboard-${key}.png`, png);
  console.log(`✓ ${T.name} → /tmp/dashboard-${key}.png (${Math.round(png.length / 1024)}KB)`);
}
