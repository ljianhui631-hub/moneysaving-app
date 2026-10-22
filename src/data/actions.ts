import type { LucideIcon } from 'lucide-react'
import {
  Bike,
  BookOpen,
  Coffee,
  CupSoda,
  Egg,
  Footprints,
  GraduationCap,
  Library,
  Moon,
  Soup,
  Sofa,
  Utensils,
  Flame,
  Trophy,
  ShieldCheck,
  Sparkles,
  Pizza,
  Users,
  IceCreamCone,
  ShoppingBag,
  Ticket,
} from 'lucide-react'

export type ActionCategory = 'food' | 'study' | 'social'

export interface DowngradeAction {
  id: string
  category: ActionCategory
  title: string
  /** 场景提示：什么时候做 */
  hint: string
  saveMin: number
  saveMax: number
  /** daily = 每天可重复；oneoff = 一次性折算 */
  frequency: 'daily' | 'oneoff'
  /** 互斥组：同组动作不会被同时推荐（节省口径重叠） */
  group: string
  icon: LucideIcon
}

export const CATEGORY_META: Record<ActionCategory, { label: string; tone: string; dot: string }> = {
  food: { label: '食堂餐饮降级', tone: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  study: { label: '校园出行与学习', tone: 'bg-campus-50 text-campus-700', dot: 'bg-campus-500' },
  social: { label: '宿舍社交与娱乐', tone: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
}

export const ACTION_LIBRARY: DowngradeAction[] = [
  // ---------- 食堂餐饮降级 ----------
  {
    id: 'canteen-meal',
    category: 'food',
    title: '不点外卖，午晚饭改吃食堂大众套餐/自选菜',
    hint: '11:40 下课直奔一食堂，错峰不排队',
    saveMin: 15,
    saveMax: 25,
    frequency: 'daily',
    group: 'meal',
    icon: Utensils,
  },
  {
    id: 'noodle-dinner',
    category: 'food',
    title: '晚餐改吃食堂面条 / 清淡粥配包子',
    hint: '晚自习前一碗素面，清爽不犯困',
    saveMin: 8,
    saveMax: 10,
    frequency: 'daily',
    group: 'meal',
    icon: Soup,
  },
  {
    id: 'self-tea',
    category: 'food',
    title: '不喝现制奶茶/瑞幸，自备水杯泡茶或喝开水',
    hint: '开水房接一杯，茶包常备书包里',
    saveMin: 12,
    saveMax: 18,
    frequency: 'daily',
    group: 'drink',
    icon: Coffee,
  },
  {
    id: 'canteen-breakfast',
    category: 'food',
    title: '早餐去食堂买包子鸡蛋，不去校外便利店',
    hint: '7:30 前到食堂，两个包子一个蛋',
    saveMin: 5,
    saveMax: 5,
    frequency: 'daily',
    group: 'breakfast',
    icon: Egg,
  },
  {
    id: 'no-night-snack',
    category: 'food',
    title: '坚决不吃宿舍深夜泡面 / 烧烤炸鸡',
    hint: '23:00 后关掉外卖 App，早点洗漱',
    saveMin: 20,
    saveMax: 20,
    frequency: 'daily',
    group: 'night',
    icon: Moon,
  },
  // ---------- 校园出行与学习 ----------
  {
    id: 'walk-bike',
    category: 'study',
    title: '赶课不骑共享电单车，骑二手自行车或步行',
    hint: '提前 10 分钟出门，顺便刷步数',
    saveMin: 3,
    saveMax: 6,
    frequency: 'daily',
    group: 'commute',
    icon: Bike,
  },
  {
    id: 'used-books',
    category: 'study',
    title: '教辅/考级资料去二手群、闲鱼或图书馆借阅打印',
    hint: '先在年级群问学长学姐有没有旧书',
    saveMin: 30,
    saveMax: 30,
    frequency: 'oneoff',
    group: 'books',
    icon: BookOpen,
  },
  {
    id: 'library-study',
    category: 'study',
    title: '自习不去付费自习室/校外咖啡厅，去图书馆',
    hint: '图书馆免费空调 + 插座，占座要趁早',
    saveMin: 25,
    saveMax: 25,
    frequency: 'daily',
    group: 'study',
    icon: Library,
  },
  // ---------- 宿舍社交与娱乐 ----------
  {
    id: 'decline-group-tea',
    category: 'social',
    title: '婉拒本周奶茶拼单，改约图书馆/操场刷圈散步',
    hint: '“我在攒 iPad，下次我请你们喝开水😂”',
    saveMin: 18,
    saveMax: 18,
    frequency: 'daily',
    group: 'drink',
    icon: Footprints,
  },
  {
    id: 'pause-shopping',
    category: 'social',
    title: '暂缓购买宿舍非必需装饰与冲动日用品',
    hint: '加购物车冷静 7 天，大概率就不想要了',
    saveMin: 20,
    saveMax: 20,
    frequency: 'daily',
    group: 'shopping',
    icon: Sofa,
  },
]

export const ACTION_MAP = Object.fromEntries(ACTION_LIBRARY.map((a) => [a.id, a])) as Record<
  string,
  DowngradeAction
>

/* ---------- 校园常见非必要消费快捷项 ---------- */
export interface ImpulsePreset {
  label: string
  amount: number
  icon: LucideIcon
}

export const IMPULSE_PRESETS: ImpulsePreset[] = [
  { label: '喜茶/霸王茶姬', amount: 18, icon: CupSoda },
  { label: '宵夜烧烤', amount: 45, icon: Pizza },
  { label: '宿舍拼单奶茶', amount: 15, icon: IceCreamCone },
  { label: '周末聚餐', amount: 100, icon: Users },
  { label: '瑞幸咖啡', amount: 13, icon: Coffee },
  { label: '冲动网购', amount: 59, icon: ShoppingBag },
  { label: '电影/剧本杀', amount: 68, icon: Ticket },
]

/* ---------- 徽章 ---------- */
export interface BadgeStats {
  actionDays: Record<string, number>
  streak: number
  resistCount: number
  resistTotal: number
  plansCompleted: number
}

export interface BadgeDef {
  id: string
  name: string
  desc: string
  icon: LucideIcon
  tone: string
  test: (s: BadgeStats) => boolean
}

const sumDays = (s: BadgeStats, ids: string[]) => ids.reduce((acc, id) => acc + (s.actionDays[id] ?? 0), 0)

export const BADGES: BadgeDef[] = [
  {
    id: 'canteen-master',
    name: '食堂自律达人',
    desc: '紧缩期累计 3 天完成食堂类降级',
    icon: Utensils,
    tone: 'from-emerald-400 to-emerald-600',
    test: (s) => sumDays(s, ['canteen-meal', 'noodle-dinner', 'canteen-breakfast', 'no-night-snack']) >= 3,
  },
  {
    id: 'water-warrior',
    name: '开水房战神',
    desc: '累计 3 天戒奶茶，自带水杯',
    icon: Coffee,
    tone: 'from-sky-400 to-campus-600',
    test: (s) => sumDays(s, ['self-tea', 'decline-group-tea']) >= 3,
  },
  {
    id: 'library-nail',
    name: '图书馆钉子户',
    desc: '累计 3 天在图书馆免费自习',
    icon: GraduationCap,
    tone: 'from-campus-400 to-campus-700',
    test: (s) => sumDays(s, ['library-study']) >= 3,
  },
  {
    id: 'streak-3',
    name: '三连自律',
    desc: '连续 3 天紧缩打卡全部达标',
    icon: Flame,
    tone: 'from-amber-400 to-orange-500',
    test: (s) => s.streak >= 3,
  },
  {
    id: 'first-resist',
    name: '回宿舍自习',
    desc: '第一次忍住冲动消费',
    icon: ShieldCheck,
    tone: 'from-emerald-300 to-teal-600',
    test: (s) => s.resistCount >= 1,
  },
  {
    id: 'iron-will',
    name: '钢铁意志',
    desc: '抵制诱惑成就金累计 ¥200',
    icon: Sparkles,
    tone: 'from-fuchsia-400 to-campus-600',
    test: (s) => s.resistTotal >= 200,
  },
  {
    id: 'payback-king',
    name: '补差王者',
    desc: '完整完成一次紧缩补差计划',
    icon: Trophy,
    tone: 'from-amber-300 to-amber-600',
    test: (s) => s.plansCompleted >= 1,
  },
]
