// Central definition of the three subscription tiers, shared by the pricing
// page, the account menu, and the gates.
export type TierInfo = {
  level: number; // 0 free · 1 standard · 2 premium
  name: string;
  price: string;
  tagline: string;
  features: string[];
};

export const TIERS: TierInfo[] = [
  {
    level: 0,
    name: "免费",
    price: "免费",
    tagline: "注册即可体验",
    features: ["个人蓝图命盘图", "总体故事 AI 解读（免费样本）"],
  },
  {
    level: 1,
    name: "标准",
    price: "68 SGD / 月",
    tagline: "完整人生蓝图解析",
    features: [
      "包含免费版全部内容",
      "数字故事 · 隐藏性格 · 能力分布",
      "健康关系 · 事业选择 · 最好方向",
      "合数",
      "择日",
    ],
  },
  {
    level: 2,
    name: "尊享",
    price: "94 SGD / 月",
    tagline: "全部功能解锁",
    features: ["包含标准版全部内容", "电话号码八大行星分析"],
  },
];

export function tierName(level: number): string {
  return TIERS.find((t) => t.level === level)?.name ?? "免费";
}
