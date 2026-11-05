import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/Login Page/loginView.vue'
import RegisterView from '../views/Login Page/registerView.vue'
import ProfileView from '../views/Profile Page/profileView.vue'
import dashboardView from '../views/dashboardView.vue'
import addTransactionView from '../views/addTransactionView.vue'
import budgetView from '../views/budgetView.vue'
import historyView from '../views/History/historyView.vue'
import transactionDetailView from '../views/History/transactionDetailView.vue'
import editProfileView from '../views/Profile Page/editProfileView.vue'
import ForgotPasswordView from '@/views/Login Page/forgotPasswordView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        background: 'auth',
      },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        background: 'auth',
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: {
        background: 'auth',
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: dashboardView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: budgetView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/histories',
      name: 'histories',
      component: historyView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/transactions/:id',
      name: 'transaction-detail',
      component: transactionDetailView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/transactions/add',
      name: 'add-transaction',
      component: addTransactionView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/profile/edit',
      name: 'edit-profile',
      component: editProfileView,
      meta: {
        requiresAuth: true,
        background: 'profile',
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
  if (authStore.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    return { name: 'profile' }
  }

  return true
})

export default router
