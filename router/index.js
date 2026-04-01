import DashBoard from "@/components/DashBoard.vue";
import Deposit from "@/components/Deposit.vue";
import Transfer from "@/components/Transfer.vue";
import TransactionHistory from "@/components/TransactionHistory.vue";
import Beneficiaries from "@/components/Beneficiaries.vue";
import SetPin from "@/components/SetPin.vue";
import ChangePin from "@/components/ChangePin.vue";
import Home from "@/components/Home.vue";
import LogIn from "@/components/LogIn.vue";
import SignUp from "@/components/SignUp.vue";
import NotFound from "@/components/NotFound.vue";
import { createRouter, createWebHistory, RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Withdraw from "@/components/Withdraw.vue";
import Profile from "@/components/Profile.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
  },
  {
    path: "/signup",
    name: "signup",
    component: SignUp,
  },
  {
    path: "/login",
    name: "Login",
    component: LogIn,
  },
  {
    path: "/dashboard/:userId",
    component: RouterView,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        component: DashBoard,
      },
      {
        path: "deposit",
        name: "Deposit",
        component: Deposit,
      },
      {
        path: "transfer",
        name: "Transfer",
        component: Transfer,
      },
      {
        path: "transactions",
        name: "TransactionHistory",
        component: TransactionHistory,
      },
      {
        path: "beneficiaries",
        name: "Beneficiaries",
        component: Beneficiaries,
      },
      {
        path: "set-pin",
        name: "SetPin",
        component: SetPin,
      },
      {
        path: "change-pin",
        name: "ChangePin",
        component: ChangePin,
      },
      {
        path: "withdraw",
        name: "Withdraw",
        component: Withdraw,
      },
      {
        path: "profile",
        name: "Profile",
        component: Profile,
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: "Login" };
  }

  // Hydrate user on refresh so :userId ownership checks can be enforced when possible.
  if (requiresAuth && authStore.isAuthenticated && !authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch (err) {
      if (err?.response?.status === 401) {
        authStore.clearAuth();
        return { name: "Login" };
      }

      // For non-401 failures (network/server hiccup), proceed and let page-level retry UI handle it.
      return true;
    }
  }

  const authUserId = authStore.user?.id ? String(authStore.user.id) : null;
  const hasUserIdParam = typeof to.params.userId !== "undefined";
  const routeUserId = hasUserIdParam ? String(to.params.userId) : null;

  if (authStore.isAuthenticated && (to.name === "Login" || to.name === "signup")) {
    if (authUserId) {
      return { name: "Dashboard", params: { userId: authUserId } };
    }

    return true;
  }

  // Enforce ownership only on routes that explicitly include :userId.
  if (requiresAuth && hasUserIdParam && authUserId && routeUserId !== authUserId) {
    return {
      name: to.name,
      params: { ...to.params, userId: authUserId },
      query: to.query,
      hash: to.hash,
      replace: true,
    };
  }

  return true;
});

export default router;
