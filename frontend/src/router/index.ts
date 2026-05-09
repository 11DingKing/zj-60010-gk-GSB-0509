import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/stores/user";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/Register.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/home",
    name: "Home",
    component: () => import("@/views/Home.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/materials",
    name: "Materials",
    component: () => import("@/views/Materials.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/skills",
    name: "Skills",
    component: () => import("@/views/Skills.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/training/:id",
    name: "Training",
    component: () => import("@/views/Training.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/skill-training/:skillType",
    name: "SkillTraining",
    component: () => import("@/views/Training.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/challenge",
    name: "Challenge",
    component: () => import("@/views/Challenge.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/wrong-answers",
    name: "WrongAnswers",
    component: () => import("@/views/WrongAnswers.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("@/views/Profile.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  userStore.initFromStorage();

  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next({ name: "Login", query: { redirect: to.fullPath } });
  } else if (
    (to.name === "Login" || to.name === "Register") &&
    userStore.isLoggedIn
  ) {
    next({ name: "Home" });
  } else {
    next();
  }
});

export default router;
