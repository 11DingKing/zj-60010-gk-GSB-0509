import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { User, SkillType, AnswerResult } from "@/types";
import { authApi, LoginParams, RegisterParams } from "@/api";

export const useUserStore = defineStore("user", () => {
  const token = ref<string | null>(localStorage.getItem("token"));
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  async function login(params: LoginParams) {
    const result = await authApi.login(params);
    token.value = result.token;
    user.value = result.user;
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    return result;
  }

  async function register(params: RegisterParams) {
    const result = await authApi.register(params);
    token.value = result.token;
    user.value = result.user;
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    return result;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  function initFromStorage() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch {
        user.value = null;
      }
    }
    if (!token.value) {
      logout();
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout,
    initFromStorage,
  };
});
