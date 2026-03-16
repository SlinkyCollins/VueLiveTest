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
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Withdraw from "@/components/Withdraw.vue";

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
    path: "/dashboard",
    name: "Dashboard",
    component: DashBoard,
    meta: { requiresAuth: true },
  },
  {
    path: "/deposit",
    name: "Deposit",
    component: Deposit,
    meta: { requiresAuth: true },
  },
  {
    path: "/transfer",
    name: "Transfer",
    component: Transfer,
    meta: { requiresAuth: true },
  },
  {
    path: "/transactions",
    name: "TransactionHistory",
    component: TransactionHistory,
    meta: { requiresAuth: true },
  },
  {
    path: "/beneficiaries",
    name: "Beneficiaries",
    component: Beneficiaries,
    meta: { requiresAuth: true },
  },
  {
    path: "/set-pin",
    name: "SetPin",
    component: SetPin,
    meta: { requiresAuth: true },
  },
  {
    path: "/change-pin",
    name: "ChangePin",
    component: ChangePin,
    meta: { requiresAuth: true },
  },
  {
    path: "/withdraw",
    name: "Withdraw",
    component: Withdraw,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Login" });
  } else if (authStore.isAuthenticated && (to.name === "Login" || to.name === "signup")) {
    next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;
