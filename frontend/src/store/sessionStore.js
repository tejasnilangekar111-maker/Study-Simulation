import { create } from 'zustand'
import { DEFAULT_WORK_MINUTES, DEFAULT_BREAK_MINUTES } from '../utils/constants'
import { useSidebarStore } from './sidebarStore'

export const useSessionStore = create((set, get) => ({
  workMinutes: DEFAULT_WORK_MINUTES,
  breakMinutes: DEFAULT_BREAK_MINUTES,
  mode: 'work', // 'work' | 'break'
  secondsLeft: DEFAULT_WORK_MINUTES * 60,
  isRunning: false,
  secondsAccumulated: 0, // work-mode seconds banked toward the next whole-minute credit

  setDurations: (workMinutes, breakMinutes) =>
    set((state) => ({
      workMinutes,
      breakMinutes,
      secondsLeft: state.mode === 'work' ? workMinutes * 60 : breakMinutes * 60,
    })),

  start: () => set({ isRunning: true }),
  pause: () =>
    set((state) => {
      if (state.mode === 'work' && state.secondsAccumulated > 0) {
        useSidebarStore.getState().recordStudyMinutes(1)
        return { isRunning: false, secondsAccumulated: 0 }
      }
      return { isRunning: false }
    }),

  tick: () =>
    set((state) => {
      if (!state.isRunning) return {}

      if (state.secondsLeft <= 1) {
        const nextMode = state.mode === 'work' ? 'break' : 'work'
        if (state.mode === 'work') {
          // Credit the final partial minute of this work block on rollover so
          // short/odd-length sessions don't lose their last few seconds.
          useSidebarStore.getState().recordStudyMinutes(1)
        }
        return {
          mode: nextMode,
          secondsLeft: nextMode === 'work' ? state.workMinutes * 60 : state.breakMinutes * 60,
          secondsAccumulated: 0,
          justCompleted: true,
        }
      }

      const secondsLeft = state.secondsLeft - 1
      if (state.mode !== 'work') {
        return { secondsLeft, justCompleted: false }
      }

      // Credit one study minute to analytics/streak for every 60 seconds of
      // actual elapsed work time, instead of only when a full session
      // completes — otherwise a short test/interrupted session records nothing.
      const secondsAccumulated = state.secondsAccumulated + 1
      if (secondsAccumulated >= 60) {
        useSidebarStore.getState().recordStudyMinutes(1)
        return { secondsLeft, secondsAccumulated: secondsAccumulated - 60, justCompleted: false }
      }
      return { secondsLeft, secondsAccumulated, justCompleted: false }
    }),

  skip: () =>
    set((state) => {
      if (state.mode === 'work' && state.secondsAccumulated > 0) {
        useSidebarStore.getState().recordStudyMinutes(1)
      }
      const nextMode = state.mode === 'work' ? 'break' : 'work'
      return {
        mode: nextMode,
        secondsLeft: nextMode === 'work' ? state.workMinutes * 60 : state.breakMinutes * 60,
        secondsAccumulated: 0,
      }
    }),

  reset: () =>
    set((state) => {
      if (state.mode === 'work' && state.secondsAccumulated > 0) {
        useSidebarStore.getState().recordStudyMinutes(1)
      }
      return {
        mode: 'work',
        secondsLeft: state.workMinutes * 60,
        isRunning: false,
        secondsAccumulated: 0,
      }
    }),
}))
