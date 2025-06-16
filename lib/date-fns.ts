import { format } from "date-fns"
import { ko } from "date-fns/locale"

export const formatDate = (date: Date | string, includeTime = false) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  if (includeTime) {
    return format(dateObj, "yyyy년 MM월 dd일 HH:mm", { locale: ko })
  }
  return format(dateObj, "yyyy년 MM월 dd일", { locale: ko })
}

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":")
  return `${hours}:${minutes}`
}

export const formatDateWithSeparator = (date: Date | string, separator = "-") => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return format(dateObj, `yyyy${separator}MM${separator}dd`, { locale: ko })
}