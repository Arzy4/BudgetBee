import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/authPage/LoginView.vue'
import RegisterView from '../views/authPage/RegisterView.vue'
import ProfileView from '../views/profilePage/ProfileView.vue'
import DashboardView from '../views/DashboardView.vue'
import AddTransactionView from '../views/AddTransactionView.vue'
import BudgetView from '../views/BudgetView.vue'
import HistoryView from '../views/historyPage/HistoryView.vue'
import TransactionDetailView from '../views/historyPage/TransactionDetailView.vue'
import EditProfileView from '../views/profilePage/EditProfileView.vue'
import ForgotPasswordView from '@/views/authPage/ForgotPasswordView.vue'
import ChangePasswordView from '@/views/profilePage/ChangePasswordView.vue'
import NotificationSettingsView from '@/views/profilePage/NotificationSettingsView.vue'
import DataManagementView from '@/views/profilePage/DataManagementView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
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
      component: DashboardView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: BudgetView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/histories',
      name: 'histories',
      component: HistoryView,
      meta: {
        requiresAuth: true,
        background: 'dashboard',
      },
    },
    {
      path: '/transactions/:id',
      name: 'transaction-detail',
      component: TransactionDetailView,
      meta: {
        requiresAuth: true,
        background: 'profile',
      },
    },
    {
      path: '/transactions/add',
      name: 'add-transaction',
      component: AddTransactionView,
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
      component: EditProfileView,
      meta: {
        requiresAuth: true,
        background: 'profile',
      },
    },
    {
      path: '/profile/change-password',
      name: 'change-password',
      component: ChangePasswordView,
      meta: {
        requiresAuth: true,
        background: 'profile',
      },
    },
    {
      path: '/profile/notifications',
      name: 'NotificationSettings',
      component: NotificationSettingsView,
      meta: { 
        requiresAuth: true 
      },
    },
    {
  path: '/profile/data-management',
  name: 'DataManagement',
  component: DataManagementView,
  meta: { 
    requiresAuth: true 
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
    return { name: 'dashboard' }
  }

  return true
})

export default router
