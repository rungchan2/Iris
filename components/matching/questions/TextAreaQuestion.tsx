'use client'

interface TextAreaQuestionProps {
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
}

export default function TextAreaQuestion({ 
  value, 
  onChange, 
  placeholder = "답변을 입력해주세요..."
}: TextAreaQuestionProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full min-h-[200px] p-4 
          border-2 border-gray-200 rounded-xl
          focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100
          resize-none transition-all duration-200
          text-gray-700 placeholder-gray-400
        "
        maxLength={500}
      />
      
      <div className="flex justify-between text-sm text-gray-500">
        <span>선택사항입니다. 자유롭게 작성해주세요.</span>
        <span>{(value || '').length} / 500</span>
      </div>
    </div>
  )
}