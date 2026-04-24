import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import api from '../utils/api.js'
import useStore from './useStore.js'

export default function useSaveProject() {
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)

  const {
    project,
    zones,
    calcResult,
  } = useStore()

  return { isSaving }
}