// ==========================================
// ANIMATION UTILITIES
// ==========================================
// Utilities for smooth animations and transitions

'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePrefersReducedMotion } from '../hooks/useAccessibility'

// ==========================================
// ANIMATION VARIANTS
// ==========================================

/**
 * Common animation variants respecting reduced motion preferences
 */
export const animations = {
  // Fade animations
  fadeIn: (duration = 0.3) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration },
  }),

  fadeInUp: (duration = 0.3, distance = 20) => ({
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: distance },
    transition: { duration },
  }),

  fadeInDown: (duration = 0.3, distance = 20) => ({
    initial: { opacity: 0, y: -distance },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -distance },
    transition: { duration },
  }),

  // Scale animations
  scaleIn: (duration = 0.3) => ({
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration },
  }),

  scaleUp: (duration = 0.2) => ({
    initial: { scale: 1 },
    animate: { scale: 1.05 },
    transition: { duration },
  }),

  // Slide animations
  slideInLeft: (duration = 0.3, distance = 100) => ({
    initial: { x: -distance, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -distance, opacity: 0 },
    transition: { duration },
  }),

  slideInRight: (duration = 0.3, distance = 100) => ({
    initial: { x: distance, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: distance, opacity: 0 },
    transition: { duration },
  }),

  // Stagger children
  staggerContainer: (staggerDelay = 0.1) => ({
    animate: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }),
}

// ==========================================
// CSS ANIMATION CLASSES
// ==========================================

/**
 * Tailwind animation classes with reduced motion support
 */
export function getAnimationClass(
  animation: string,
  prefersReducedMotion: boolean
): string {
  if (prefersReducedMotion) return ''

  const animationMap: Record<string, string> = {
    'fade-in': 'animate-in fade-in duration-300',
    'fade-out': 'animate-out fade-out duration-300',
    'slide-in-from-top': 'animate-in slide-in-from-top-4 duration-300',
    'slide-in-from-bottom': 'animate-in slide-in-from-bottom-4 duration-300',
    'slide-in-from-left': 'animate-in slide-in-from-left-4 duration-300',
    'slide-in-from-right': 'animate-in slide-in-from-right-4 duration-300',
    'scale-in': 'animate-in zoom-in-95 duration-200',
    'scale-out': 'animate-out zoom-out-95 duration-200',
    'spin': 'animate-spin',
    'pulse': 'animate-pulse',
    'bounce': 'animate-bounce',
  }

  return animationMap[animation] || ''
}

// ==========================================
// TRANSITION UTILITIES
// ==========================================

/**
 * Get transition classes based on motion preferences
 */
export function getTransitionClass(
  type: 'all' | 'colors' | 'opacity' | 'transform' | 'shadow' = 'all',
  duration: 'fast' | 'normal' | 'slow' = 'normal',
  prefersReducedMotion: boolean = false
): string {
  if (prefersReducedMotion) return ''

  const durationMap = {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
  }

  const typeMap = {
    all: 'transition-all',
    colors: 'transition-colors',
    opacity: 'transition-opacity',
    transform: 'transition-transform',
    shadow: 'transition-shadow',
  }

  return `${typeMap[type]} ${durationMap[duration]} ease-in-out`
}

// ==========================================
// EASING FUNCTIONS
// ==========================================

/**
 * Custom easing functions
 */
export const easings = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Custom easings
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
}

// ==========================================
// STAGGER DELAY UTILITY
// ==========================================

/**
 * Calculate stagger delay for list items
 */
export function getStaggerDelay(index: number, baseDelay = 50): string {
  return `${index * baseDelay}ms`
}

// ==========================================
// ANIMATION HOOK
// ==========================================

/**
 * Hook to conditionally apply animations based on reduced motion
 * 
 * @example
 * ```tsx
 * const animationProps = useAnimation('fade-in')
 * return <div className={animationProps.className}>Content</div>
 * ```
 */
export function useAnimation(animationType: string) {
  const prefersReducedMotion = usePrefersReducedMotion()
  
  return {
    className: getAnimationClass(animationType, prefersReducedMotion),
    shouldAnimate: !prefersReducedMotion,
  }
}

// ==========================================
// INTERSECTION OBSERVER ANIMATION
// ==========================================

/**
 * Hook for scroll-triggered animations
 * 
 * @example
 * ```tsx
 * const { ref, isVisible } = useInViewAnimation()
 * return <div ref={ref} className={isVisible ? 'fade-in' : 'opacity-0'}>Content</div>
 * ```
 */
export function useInViewAnimation<T extends HTMLElement>(
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<T | null>(null)

  const refCallback = useCallback((node: T | null) => {
    setRef(node)
  }, [])

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    )

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return { ref: refCallback, isVisible }
}

// ==========================================
// SKELETON LOADER VARIANTS
// ==========================================

/**
 * Skeleton loader animation classes
 */
export const skeletonVariants = {
  default: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
  shimmer: 'relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-[shimmer_2s_infinite]',
  wave: 'animate-[wave_1.5s_ease-in-out_infinite] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded',
}

// Add this to your tailwind config for shimmer effect:
/*
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes wave {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
*/
