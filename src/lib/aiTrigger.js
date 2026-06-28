import { createRef } from 'react'

// Shared ref so BottomNav can open ClientAIAssistant without prop drilling
export const aiTriggerRef = createRef()
