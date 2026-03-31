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
import { createRouter, createWebHistory, RouterView } from "vue-router";
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
    ],
  },
  {
    path: "/deposit",
    redirect: { name: "Deposit" },
  },
  {
    path: "/transfer",
    redirect: { name: "Transfer" },
  },
  {
    path: "/transactions",
    redirect: { name: "TransactionHistory" },
  },
  {
    path: "/beneficiaries",
    redirect: { name: "Beneficiaries" },
  },
  {
    path: "/set-pin",
    redirect: { name: "SetPin" },
  },
  {
    path: "/change-pin",
    redirect: { name: "ChangePin" },
  },
  {
    path: "/withdraw",
    redirect: { name: "Withdraw" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Login" });
  } else if (authStore.isAuthenticated && (to.name === "Login" || to.name === "signup")) {
    next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;
