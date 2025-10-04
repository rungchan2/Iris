'use client'

import { useState } from 'react'
import { SurveyChoice } from '@/types/matching.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Edit,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { useChoiceMutations } from '@/lib/hooks/use-survey-management'

interface ChoiceEditorProps {
  questionId: string
  choices: SurveyChoice[]
  onUpdate: (choices: SurveyChoice[]) => void
}

export default function ChoiceEditor({
  questionId,
  choices,
  onUpdate
}: ChoiceEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [adding, setAdding] = useState(false)
  const [newChoice, setNewChoice] = useState({
    choice_key: '',
    choice_label: '',
    choice_order: choices.length + 1
  })

  const { create, update, remove } = useChoiceMutations(questionId)

  const startEdit = (choice: SurveyChoice) => {
    setEditingId(choice.id)
    setEditText(choice.choice_label)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveChoice = async (choiceId: string) => {
    await update.mutateAsync({
      choiceId,
      data: { choice_label: editText }
    })

    setEditingId(null)
    setEditText('')
  }

  const deleteChoice = async (choiceId: string) => {
    await remove.mutateAsync(choiceId)
  }

  const addChoice = async () => {
    if (!newChoice.choice_key || !newChoice.choice_label) {
      toast.error('선택지 키와 라벨을 모두 입력해주세요')
      return
    }

    await create.mutateAsync({
      choice_key: newChoice.choice_key,
      choice_label: newChoice.choice_label,
      choice_order: newChoice.choice_order
    })

    setNewChoice({
      choice_key: '',
      choice_label: '',
      choice_order: choices.length + 2
    })
    setAdding(false)
  }

  const toggleActive = async (choiceId: string, isActive: boolean) => {
    await update.mutateAsync({
      choiceId,
      data: { is_active: isActive }
    })
  }

  const getEmbeddingStatus = (choice: SurveyChoice) => {
    if (choice.choice_embedding) {
      return <Badge variant="outline" className="gap-1 text-green-600">
        <CheckCircle className="h-3 w-3" />
        완료
      </Badge>
    } else {
      return <Badge variant="outline" className="gap-1 text-yellow-600">
        <Clock className="h-3 w-3" />
        대기
      </Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            선택지 관리
            <Badge variant="secondary">
              {choices.length}개
            </Badge>
          </CardTitle>
          <Button 
            onClick={() => setAdding(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            선택지 추가
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Existing Choices */}
        {choices
          .sort((a, b) => a.choice_order - b.choice_order)
          .map((choice) => (
            <div
              key={choice.id}
              className="flex items-center gap-3 p-4 border rounded-lg"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {choice.choice_key}
                  </Badge>
                  {getEmbeddingStatus(choice)}
                </div>
                
                {editingId === choice.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveChoice(choice.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                    />
                    <Button 
                      size="sm"
                      onClick={() => saveChoice(choice.id)}
                      disabled={update.isPending}
                    >
                      {update.isPending ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm">{choice.choice_label}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={choice.is_active || false}
                  onCheckedChange={(checked) => toggleActive(choice.id, checked)}
                />
                
                {editingId !== choice.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(choice)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>선택지 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 선택지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteChoice(choice.id)}>
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

        {/* Add New Choice */}
        {adding && (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-4">
            <h4 className="font-medium">새 선택지 추가</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>선택지 키</Label>
                <Input
                  value={newChoice.choice_key}
                  onChange={(e) => setNewChoice(prev => ({
                    ...prev,
                    choice_key: e.target.value
                  }))}
                  placeholder="예: option_1"
                />
              </div>
              
              <div className="space-y-2">
                <Label>순서</Label>
                <Input
                  type="number"
                  value={newChoice.choice_order}
                  onChange={(e) => setNewChoice(prev => ({
                    ...prev,
                    choice_order: Number(e.target.value)
                  }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>선택지 라벨</Label>
              <Input
                value={newChoice.choice_label}
                onChange={(e) => setNewChoice(prev => ({
                  ...prev,
                  choice_label: e.target.value
                }))}
                placeholder="사용자에게 보여질 텍스트를 입력하세요"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addChoice}>
                추가
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAdding(false)
                  setNewChoice({
                    choice_key: '',
                    choice_label: '',
                    choice_order: choices.length + 1
                  })
                }}
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {choices.length === 0 && !adding && (
          <div className="text-center py-8 text-muted-foreground">
            아직 선택지가 없습니다. 선택지를 추가해보세요.
          </div>
        )}
      </CardContent>
    </Card>
  )
}