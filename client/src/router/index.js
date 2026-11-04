import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import CourtsView from "../views/CourtsView.vue";
import ReservationsView from "../views/ReservationsView.vue";
import PoliciesView from "../views/PoliciesView.vue";
import AdminCourtsView from "../views/AdminCourtsView.vue";
import MetricsView from "../views/MetricsView.vue";
import AdminUsersView from "../views/AdminUsersView.vue";
import ProfileView from "../views/ProfileView.vue";
import ChangePasswordView from "../views/ChangePasswordView.vue";

const routes = [
  { path: "/", redirect: "/canchas" },
  { path: "/login", component: LoginView },
  { path: "/register", component: RegisterView },
  { path: "/canchas", component: CourtsView },
  { path: "/reservas", component: ReservationsView },
  { path: "/politicas", component: PoliciesView },
  { path: "/perfil", component: ProfileView },
  { path: "/cambiar-password", component: ChangePasswordView },
  {
    path: "/admin/canchas",
    component: AdminCourtsView,
    meta: { requiresAdmin: true },
  },
  {
    path: "/admin/usuarios",
    component: AdminUsersView,
    meta: { requiresAdmin: true },
  },
  {
    path: "/admin/metricas",
    component: MetricsView,
    meta: { requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return "/canchas";
  }
});

export default router;
