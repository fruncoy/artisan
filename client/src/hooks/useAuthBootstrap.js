import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export function useAuthBootstrap() {
  const init = useAuthStore((state) => state.init)
  useEffect(() => {
    init()
  }, [init])
}
