export type Course = {
  id: string
  /** MSMH — mã số môn học */
  code: string
  name: string
  /** Giảng viên phụ trách môn */
  leadLecturer?: string
  /** Giảng viên lý thuyết */
  theoryLecturers: string[]
  /** Trợ giảng / thực hành */
  practiceLecturers: string[]
}
