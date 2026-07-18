import type { Course } from "@/types/course"

/** Môn học Tổ VLSI — lead + theory + practice teams */
export const initialCourses: Course[] = [
  {
    id: "1",
    code: "CO1023",
    name: "Hệ thống số",
    leadLecturer: "Trần Ngọc Thịnh",
    theoryLecturers: ["Võ Tuấn Bình", "Phạm Quốc Cường", "Trần Ngọc Thịnh"],
    practiceLecturers: [
      "Nguyễn Thành Lộc",
      "Nguyễn Xuân Minh",
      "Đoàn Minh Vững",
      "Tôn Huỳnh Long",
    ],
  },
  {
    id: "2",
    code: "CO1025",
    name: "Thiết kế Luận lý Với HDL",
    leadLecturer: "Phạm Quốc Cường",
    theoryLecturers: ["Phạm Kiều Nhật Anh", "Võ Tuấn Bình", "Trần Ngọc Thịnh"],
    practiceLecturers: [
      "Phạm Kiều Nhật Anh",
      "Nguyễn Thành Lộc",
      "Phan Văn Sỹ",
      "Tôn Huỳnh Long",
    ],
  },
  {
    id: "3",
    code: "CO2007",
    name: "Kiến trúc Máy tính",
    leadLecturer: "Phạm Quốc Cường",
    theoryLecturers: [
      "Phạm Kiều Nhật Anh",
      "Võ Tuấn Bình",
      "Phan Trần Minh Khuê",
    ],
    practiceLecturers: [
      "Nguyễn Thành Lộc",
      "Phạm Kiều Nhật Anh",
      "Nguyễn Xuân Minh",
      "Tôn Huỳnh Long",
    ],
  },
  {
    id: "4",
    code: "CO2035",
    name: "Xử lý Tín hiệu số",
    leadLecturer: "Phạm Hoàng Anh",
    theoryLecturers: ["Võ Tuấn Bình"],
    practiceLecturers: ["Phạm Công Thái"],
  },
  {
    id: "5",
    code: "CO2103",
    name: "Mạch điện - điện tử",
    leadLecturer: "Lê Trọng Nhân",
    theoryLecturers: ["Phạm Công Thái"],
    practiceLecturers: ["Phạm Công Thái"],
  },
  {
    id: "6",
    code: "CO3009",
    name: "Vi xử lý - Vi điều khiển",
    leadLecturer: "Lê Trọng Nhân",
    theoryLecturers: ["Võ Tuấn Bình"],
    practiceLecturers: [
      "Phan Văn Sỹ",
      "Tôn Huỳnh Long",
      "Nguyễn Thành Lộc",
    ],
  },
  {
    id: "7",
    code: "CO3037",
    name: "Phát triển ứng dụng Internet of Things",
    leadLecturer: "Lê Trọng Nhân",
    theoryLecturers: ["Lê Trọng Nhân", "Phan Trần Minh Khuê"],
    practiceLecturers: ["Phan Văn Sỹ"],
  },
  {
    id: "8",
    code: "CO3053",
    name: "Hệ thống nhúng",
    leadLecturer: "Phạm Hoàng Anh",
    theoryLecturers: ["Phạm Hoàng Anh"],
    practiceLecturers: ["Phan Văn Sỹ"],
  },
  {
    id: "9",
    code: "CO3097",
    name: "Thiết kế Vi mạch",
    leadLecturer: "Trần Ngọc Thịnh",
    theoryLecturers: ["Trần Ngọc Thịnh"],
    practiceLecturers: [
      "Nguyễn Thành Lộc",
      "Phạm Kiều Nhật Anh",
      "Tôn Huỳnh Long",
    ],
  },
  {
    id: "10",
    code: "CO3143",
    name: "Giới thiệu hệ thống trên chip",
    leadLecturer: "Trần Ngọc Thịnh",
    theoryLecturers: ["Phạm Kiều Nhật Anh"],
    practiceLecturers: [
      "Phạm Kiều Nhật Anh",
      "Tôn Huỳnh Long",
      "Nguyễn Thành Lộc",
    ],
  },
  {
    id: "11",
    code: "CO3145",
    name: "Thiết kế luận lý với HDL nâng cao",
    leadLecturer: "Phạm Quốc Cường",
    theoryLecturers: [],
    practiceLecturers: [],
  },
  {
    id: "12",
    code: "CO3147",
    name: "Thiết kế vi mạch nâng cao",
    leadLecturer: "Trần Ngọc Thịnh",
    theoryLecturers: ["Trần Ngọc Thịnh"],
    practiceLecturers: [],
  },
  {
    id: "13",
    code: "CO3149",
    name: "Tổng hợp luận lý vi mạch",
    theoryLecturers: [],
    practiceLecturers: [],
  },
  {
    id: "14",
    code: "CO3043",
    name: "Lập trình di động",
    leadLecturer: "Phan Trần Minh Khuê",
    theoryLecturers: [],
    practiceLecturers: [],
  },
  {
    id: "15",
    code: "CO3035",
    name: "Realtime System",
    leadLecturer: "Phạm Quốc Cường",
    theoryLecturers: ["Lê Trọng Nhân", "Võ Tuấn Bình"],
    practiceLecturers: ["Nguyễn Thành Lộc", "Phan Văn Sỹ"],
  },
]

export function findCourseByCode(
  code: string,
  courses: Course[] = initialCourses
): Course | undefined {
  return courses.find((c) => c.code === code)
}
