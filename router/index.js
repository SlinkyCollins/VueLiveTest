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
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
