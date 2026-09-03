import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresTeacher?: boolean
    requiresAdmin?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/NewsView.vue'),
  },
  {
    path: '/news/:slug',
    name: 'news-item',
    component: () => import('@/views/NewsItemView.vue'),
    props: true,
  },
  {
    path: '/learning',
    name: 'learning',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/sections',
    name: 'sections',
    component: () => import('@/views/SectionsView.vue'),
  },
  {
    path: '/courses',
    name: 'catalog',
    component: () => import('@/views/CatalogView.vue'),
  },
  {
    path: '/courses/:course',
    name: 'course',
    component: () => import('@/views/CourseView.vue'),
    props: true,
  },
  {
    path: '/courses/:course/:module/lessons/:lesson',
    name: 'lesson',
    component: () => import('@/views/LessonView.vue'),
    props: true,
  },
  {
    path: '/courses/:course/:module/quizzes/:quiz',
    name: 'quiz',
    component: () => import('@/views/QuizView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/courses/:course/:module/practice/:set',
    name: 'algorithm-practice',
    component: () => import('@/views/AlgorithmPracticeView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/algorithms',
    name: 'algorithms',
    component: () => import('@/views/AlgorithmsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/algorithms/:problem',
    name: 'algorithm-solo',
    component: () => import('@/views/AlgorithmSoloView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/me',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/manage/content',
    name: 'manage-content',
    component: () => import('@/views/manage/ContentView.vue'),
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  {
    path: '/manage/lessons/:lesson',
    name: 'manage-lesson',
    component: () => import('@/views/manage/LessonEditorView.vue'),
    props: true,
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  {
    path: '/manage/quizzes/:quiz',
    name: 'manage-quiz',
    component: () => import('@/views/manage/QuizEditorView.vue'),
    props: true,
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  {
    path: '/manage/algorithms',
    name: 'manage-algorithms',
    component: () => import('@/views/manage/AlgorithmLibraryView.vue'),
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  {
    path: '/manage/algorithms/:problem',
    name: 'manage-algorithm',
    component: () => import('@/views/manage/AlgorithmProblemEditorView.vue'),
    props: true,
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  {
    path: '/manage/practice-sets/:set',
    name: 'manage-practice-set',
    component: () => import('@/views/manage/PracticeSetEditorView.vue'),
    props: true,
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  {
    path: '/manage/news',
    name: 'manage-news',
    component: () => import('@/views/manage/NewsDeskView.vue'),
    meta: { requiresAuth: true, requiresTeacher: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, saved) {
    return saved ?? { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.restore()

  if (to.meta.requiresAuth === true && !auth.isAuthenticated) {
    return { name: 'home', query: { login: to.fullPath } }
  }
  // Роль проверяет и бэкенд; здесь — чтобы не показывать заведомо запретный экран.
  if (to.meta.requiresAdmin === true && !auth.isAdmin) {
    return { name: 'sections' }
  }
  if (to.meta.requiresTeacher === true && !auth.isTeacher) {
    return { name: 'sections' }
  }
  return true
})
