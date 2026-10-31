import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/loginView.vue'
import RegisterView from '../views/registerView.vue'
import ProfileView from '../views/profileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

// Global navigation guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Restore the session once when the application starts
  if (!authStore.isInitialized) {
    await authStore.restoreSession()
  }

  // Prevent unauthenticated users from accessing protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  // Redirect authenticated users away from Login and Register
  if (
    authStore.isAuthenticated &&
    (to.name === 'login' || to.name === 'register')
  ) {
    return { name: 'profile' }
  }

  return true
})

export default router
