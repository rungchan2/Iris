import { format } from "date-fns"

export const formatDate = (date: string) => {
  return format(new Date(date), "yyyy-MM-dd")
}

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":")
  return `${hours}:${minutes}`
}