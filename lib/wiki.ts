import "server-only"

import fs from "node:fs"
import path from "node:path"

export type WikiChapter = {
  chapter_index: number
  title: string
  content: string[]
}

export type WikiNavItem = {
  title: string
  label: string
  slug: string
  category: string
  description: string
}

const wikiPath = path.join(process.cwd(), "data", "minecraft-wiki.json")

const chapterMeta: Record<string, [string, string, string]> = {
  "early-game-guide.md": [
    "Bắt đầu",
    "Hướng dẫn nhập môn",
    "Lộ trình sống sót và phát triển ban đầu",
  ],
  "installation-version.md": [
    "Bắt đầu",
    "Cài đặt & phiên bản",
    "Minecraft, NeoForge và phụ thuộc cần thiết",
  ],
  "gameplay-intro.md": [
    "Bắt đầu",
    "Giới thiệu lối chơi",
    "Những hệ thống chính của mod",
  ],
  "gameplay-flow.md": [
    "Bắt đầu",
    "Tiến trình trò chơi",
    "Từ phàm nhân đến Cổ sư ngũ chuyển",
  ],
  "controls-keybinds.md": [
    "Bắt đầu",
    "Phím điều khiển",
    "Toàn bộ phím tắt và cách xử lý xung đột",
  ],
  "faq.md": [
    "Bắt đầu",
    "Câu hỏi thường gặp",
    "Giải đáp nhanh các vấn đề phổ biến",
  ],
  "gu-worms.md": [
    "Cổ đạo",
    "Danh mục Cổ trùng",
    "Tên, cấp chuyển và công dụng Cổ trùng",
  ],
  "gu-skills.md": [
    "Cổ đạo",
    "Kỹ năng Cổ trùng",
    "Cơ chế sử dụng và phối hợp Cổ",
  ],
  "gu-refinement-recipes.md": [
    "Cổ đạo",
    "1.107 Cổ phương",
    "Nguyên liệu và thứ tự luyện chế",
  ],
  "recipes-overview.md": [
    "Cổ đạo",
    "Tổng quan luyện chế",
    "Cách đọc và sử dụng Cổ phương",
  ],
  "item-obtaining.md": [
    "Cổ đạo",
    "Cách lấy vật phẩm",
    "Nguồn thu thập vật phẩm quan trọng",
  ],
  "item-sources.md": [
    "Cổ đạo",
    "Nguồn vật phẩm",
    "Đối chiếu vật phẩm với nguồn nhận",
  ],
  "item-mechanics.md": [
    "Cổ đạo",
    "Cơ chế vật phẩm",
    "Dữ liệu chi tiết trích từ source mod",
  ],
  "sat-chieu.md": [
    "Sát chiêu",
    "Cơ chế Sát chiêu",
    "Cách mở, sử dụng và vận hành Sát chiêu",
  ],
  "sat-chieu-catalog.md": [
    "Sát chiêu",
    "68 Sát chiêu",
    "Danh mục Sát chiêu được code hỗ trợ",
  ],
  "sat-chieu-vi-tri.md": [
    "Sát chiêu",
    "Vị trí đặt Cổ",
    "Sơ đồ ô 1–10 và Cổ quyển bắt buộc",
  ],
  "cultivation.md": [
    "Tu hành",
    "Cảnh giới tu hành",
    "Không khiếu, tu vi và thăng chuyển",
  ],
  "liu-phai-guides.md": [
    "Tu hành",
    "Hướng dẫn lưu phái",
    "Lựa chọn và phát triển từng lưu phái",
  ],
  "daohen.md": [
    "Tu hành",
    "Đạo ngân",
    "Cơ chế Đạo ngân và tăng phúc sát thương",
  ],
  "hp-damage-scaling.md": [
    "Tu hành",
    "Máu & sát thương",
    "Công thức cộng dồn và giới hạn đầu ra",
  ],
  "stats-variables.md": [
    "Tu hành",
    "Chỉ số nhân vật",
    "Các biến số lưu trên người chơi",
  ],
  "equipment-sets.md": [
    "Tra cứu",
    "1.076 trang bị",
    "Bộ giáp, vị trí mặc và độ bền",
  ],
  "mob-effects.md": ["Tra cứu", "347 hiệu ứng", "Tên và ID toàn bộ mob effect"],
  "bosses.md": ["Thế giới", "Boss", "Boss hiện có và phần thưởng"],
  "bestiary-spawns.md": [
    "Thế giới",
    "Sinh vật & nơi xuất hiện",
    "185 quy tắc spawn trong biome",
  ],
  "quests-npc.md": [
    "Thế giới",
    "NPC & nhiệm vụ",
    "Nhân vật, nhiệm vụ và điều kiện",
  ],
  "town-ngu-chuyen.md": [
    "Thế giới",
    "Thị trấn ngũ chuyển",
    "Hoạt động và điểm đáng chú ý",
  ],
  "worldgen-dimensions.md": [
    "Thế giới",
    "Thế giới & chiều không gian",
    "Biome, dimension và công trình",
  ],
  "loot-tables.md": [
    "Thế giới",
    "Loot table",
    "Bảng vật phẩm rơi và rương thưởng",
  ],
  "advancements.md": [
    "Thế giới",
    "38 tiến trình",
    "Advancement, điều kiện và phần thưởng",
  ],
  "commands.md": [
    "Lệnh",
    "Lệnh của mod",
    "Các command quản trị và hỗ trợ chơi",
  ],
  "give-items.md": ["Lệnh", "/give vật phẩm", "Lệnh cấp toàn bộ item của mod"],
  "give-entities.md": [
    "Lệnh",
    "/summon thực thể",
    "Lệnh triệu hồi toàn bộ entity",
  ],
  "give-recipes.md": [
    "Lệnh",
    "/give Cổ phương",
    "Lệnh cấp nhanh công thức luyện chế",
  ],
  "ui-menus.md": [
    "Hệ thống",
    "Giao diện & menu",
    "Các màn hình và cách thao tác",
  ],
  "pinyin-glossary.md": [
    "Hệ thống",
    "Từ điển Pinyin",
    "Đối chiếu ID Pinyin với tên Việt",
  ],
  "rankings.md": ["Hệ thống", "Bảng xếp hạng", "Xếp hạng sức mạnh và lưu phái"],
  "tutorial-minecraft-ccn.md": [
    "Tài liệu gốc",
    "Hướng dẫn CCN đầy đủ",
    "Bản hướng dẫn cộng đồng nguyên gốc",
  ],
  "README.md": ["Hệ thống", "Mục lục dữ liệu", "Phạm vi và nguồn của bộ wiki"],
}

let cache: WikiChapter[] | undefined

export function getChapters() {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(wikiPath, "utf8")) as WikiChapter[]
  }
  return cache
}

export function slugFromTitle(title: string) {
  return title.replace(/\.md$/i, "")
}

export function getChapter(slug: string) {
  return getChapters().find((chapter) => slugFromTitle(chapter.title) === slug)
}

export function getWikiNavigation(): WikiNavItem[] {
  return getChapters().map((chapter) => {
    const meta = chapterMeta[chapter.title] ?? [
      "Khác",
      slugFromTitle(chapter.title),
      "Tài liệu tra cứu của mod",
    ]
    return {
      title: chapter.title,
      category: meta[0],
      label: meta[1],
      description: meta[2],
      slug: slugFromTitle(chapter.title),
    }
  })
}

export const categoryOrder = [
  "Bắt đầu",
  "Cổ đạo",
  "Sát chiêu",
  "Tu hành",
  "Tra cứu",
  "Thế giới",
  "Lệnh",
  "Hệ thống",
  "Tài liệu gốc",
  "Khác",
]
