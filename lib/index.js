/**
 * 装修面积计算
 *
 * 算房间地面/墙面面积，以及需要多少块瓷砖、多少升涂料。装修备料时用。纯本地计算，不联网。
 */

export const name = "dsh-calc-area";

export const inject = ["tools"];

const TEXT_OUTPUT = {
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      text: { type: "string" },
    },
    required: ["text"],
  },
  render: (_args, value) => [
    { type: "text", text: (value && value.text) || "" },
  ],
};

// ══════════════════════════════════════════════════════════
//  通用工具函数
// ══════════════════════════════════════════════════════════

const TITLE = "__CALC_TITLE__";

function fmt(n, digits) {
  if (!Number.isFinite(n)) return String(n);
  const d = digits == null ? 2 : digits;
  if (Math.abs(n) >= 1e12) return n.toExponential(6);
  let s = n.toFixed(d);
  if (d > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

function money(n) {
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : (def == null ? 0 : def);
}

function line(label, value, unit) {
  const pad = "  ";
  return pad + label + "：" + value + (unit ? " " + unit : "");
}

function head(title) {
  return [title, "=".repeat(52)];
}

// ══════════════════════════════════════════════════════════
//  工具
// ══════════════════════════════════════════════════════════

export function apply(ctx, config) {
  void config;

  ctx.tools.register({
    name: "calc_area",
    description:
      "装修面积计算。输入长宽高，返回地面面积、墙面面积、踢脚线长度，以及瓷砖和涂料的估算用量。",
    parameters: {
      length: { type: "number", required: true, description: "房间长（米）" },
      width: { type: "number", required: true, description: "房间宽（米）" },
      height: { type: "number", description: "层高（米），默认 2.8" },
      tile_size: { type: "number", description: "瓷砖边长（米），默认 0.8" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      try {
        const a = args || {};
        const L0 = num(a.length), W = num(a.width), H = num(a.height, 2.8);
        const ts = num(a.tile_size, 0.8);
        if (L0 <= 0 || W <= 0) return { text: "长宽要大于 0" };
        const floor = L0 * W;
        const wall = 2 * (L0 + W) * H;
        const L = head("装修面积");
        L.push(line("房间", fmt(L0, 2) + " × " + fmt(W, 2) + " × " + fmt(H, 2) + " 米"));
        L.push("");
        L.push(line("地面面积", fmt(floor, 2) + " 平方米"));
        L.push(line("墙面面积", fmt(wall, 2) + " 平方米（不扣门窗）"));
        L.push(line("踢脚线", fmt(2 * (L0 + W), 2) + " 米"));
        L.push("");
        if (ts > 0) {
          const per = ts * ts;
          const need = Math.ceil(floor / per * 1.1);   // 10% 损耗
          L.push("  【瓷砖】（" + fmt(ts * 100, 0) + "×" + fmt(ts * 100, 0) + " 厘米）");
          L.push(line("每块面积", fmt(per, 4) + " 平方米"));
          L.push(line("需要", need + " 块（含 10% 损耗）"));
        }
        // 涂料：1 升约 10-12 平米两遍
        const paint = wall / 10;
        L.push("");
        L.push("  【涂料】（按 1 升刷 10 平米两遍）");
        L.push(line("需要", fmt(paint, 1) + " 升"));
        L.push("");
        L.push("  以上不含门窗扣除、找平、防水。实际请按施工方报价。");
        return { text: L.join("\n") };
      } catch (e) {
        return { text: "计算失败: " + String((e && e.message) || e) };
      }
    },
  });
}
