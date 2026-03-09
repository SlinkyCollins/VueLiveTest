import DashBoard from "@/components/DashBoard.vue";
import Home from "@/components/Home.vue";
import LogIn from "@/components/LogIn.vue";
import SignUp from "@/components/SignUp.vue";
import { createRouter, createWebHistory } from "vue-router";

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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("access_token");

  if (to.meta.requiresAuth && !token) {
    // Trying to access protected page without token → go to login
    next({ name: "Login" });
  } else if (token && (to.name === "Login" || to.name === "signup")) {
    // Already logged in but trying to visit login/signup → go to dashboard
    next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;
