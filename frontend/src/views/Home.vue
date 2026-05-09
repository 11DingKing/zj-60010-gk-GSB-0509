<template>
  <div class="home-container">
    <el-container>
      <el-header class="header">
        <div class="logo">
          <el-icon size="32"><DataAnalysis /></el-icon>
          <span class="title">公考速算训练系统</span>
        </div>
        <div class="header-right">
          <span class="username">{{ userStore.user?.username }}</span>
          <el-button type="text" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-header>

      <el-main class="main">
        <el-row :gutter="20">
          <el-col :span="24">
            <h2 class="welcome">欢迎回来，开始你的速算训练！</h2>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mode-cards">
          <el-col :xs="24" :sm="12" :md="8">
            <el-card class="mode-card" shadow="hover" @click="goToMaterials">
              <div class="card-icon">
                <el-icon size="64" color="#409eff"><Document /></el-icon>
              </div>
              <h3>完整材料训练</h3>
              <p>
                选择一套完整的统计材料，包含5道不同类型的题目，模拟真实考试环境
              </p>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-card class="mode-card" shadow="hover" @click="goToSkills">
              <div class="card-icon">
                <el-icon size="64" color="#67c23a"><Grid /></el-icon>
              </div>
              <h3>按技巧分类训练</h3>
              <p>选择特定的速算技巧进行专项训练，巩固薄弱环节，提升解题速度</p>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-card
              class="mode-card challenge"
              shadow="hover"
              @click="goToChallenge"
            >
              <div class="card-icon">
                <el-icon size="64" color="#e6a23c"><Trophy /></el-icon>
              </div>
              <h3>计时挑战模式</h3>
              <p>
                限时8分钟完成一套材料，根据正确率和用时进行综合评分，挑战自我
              </p>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="quick-links">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>快捷入口</span>
              </template>
              <el-menu mode="horizontal" @select="handleMenuSelect">
                <el-menu-item index="wrong-answers">
                  <el-icon><Warning /></el-icon>
                  错题回顾
                </el-menu-item>
                <el-menu-item index="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-menu-item>
              </el-menu>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card>
              <template #header>
                <span>速算技巧说明</span>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="同比增长率">
                  现期值与基期值的增长率计算
                </el-descriptions-item>
                <el-descriptions-item label="比重计算">
                  部分值占整体值的百分比
                </el-descriptions-item>
                <el-descriptions-item label="倍数关系">
                  两个数值的倍数比较
                </el-descriptions-item>
                <el-descriptions-item label="平均数">
                  总量除以份数的平均值
                </el-descriptions-item>
                <el-descriptions-item label="年均增长率">
                  多年平均增长速率
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import {
  DataAnalysis,
  SwitchButton,
  Document,
  Grid,
  Trophy,
  Warning,
  User,
} from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();

const goToMaterials = () => {
  router.push("/materials");
};

const goToSkills = () => {
  router.push("/skills");
};

const goToChallenge = () => {
  router.push("/challenge");
};

const handleMenuSelect = (index: string) => {
  router.push(`/${index}`);
};

const handleLogout = () => {
  userStore.logout();
  router.push("/login");
};
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  color: white;
}

.logo .title {
  margin-left: 12px;
  font-size: 20px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  color: white;
}

.header-right .username {
  margin-right: 20px;
}

.header-right .el-button {
  color: white;
}

.main {
  padding: 30px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome {
  text-align: center;
  color: #303133;
  margin-bottom: 40px;
  font-size: 28px;
}

.mode-cards {
  margin-bottom: 40px;
}

.mode-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-card:hover {
  transform: translateY(-5px);
}

.mode-card .card-icon {
  margin-bottom: 16px;
}

.mode-card h3 {
  margin-bottom: 12px;
  color: #303133;
}

.mode-card p {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.mode-card.challenge .card-icon {
  color: #e6a23c;
}

.quick-links {
  margin-top: 20px;
}

.el-menu {
  border-right: none;
}
</style>
