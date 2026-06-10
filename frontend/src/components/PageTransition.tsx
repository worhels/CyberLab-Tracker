import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const pageEase = [0.22, 1, 0.36, 1] as const

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: pageEase }}
    >
      {children}
    </motion.div>
  )
}
