<template>
  <div class="materials-container">
    <el-container>
      <el-header class="header">
        <div class="nav">
          <el-button type="text" @click="goHome">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <span class="title">选择训练材料</span>
        </div>
      </el-header>

      <el-main class="main">
        <el-row :gutter="20" v-loading="loading">
          <el-col
            :xs="24"
            :sm="12"
            :md="8"
            v-for="material in materials"
            :key="material.id"
          >
            <el-card class="material-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="material-title">{{ material.title }}</span>
                  <el-tag
                    :type="getDifficultyType(material.difficulty)"
                    size="small"
                  >
                    {{ getDifficultyText(material.difficulty) }}
                  </el-tag>
                </div>
              </template>

              <div class="material-content">
                <p>{{ truncateText(material.content, 100) }}</p>
              </div>

              <template #footer>
                <div class="card-footer">
                  <span class="category">{{
                    material.category || "未分类"
                  }}</span>
                  <el-button
                    type="primary"
                    size="small"
                    @click="startTraining(material.id)"
                  >
                    开始训练
                  </el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>

        <el-empty
          v-if="!loading && materials.length === 0"
          description="暂无可用材料"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { materialApi } from "@/api";
import type { Material } from "@/types";

const router = useRouter();

const loading = ref(false);
const materials = ref<Material[]>([]);

const loadMaterials = async () => {
  loading.value = true;
  try {
    materials.value = await materialApi.getAll();
  } catch (error) {
    ElMessage.error("加载材料失败");
  } finally {
    loading.value = false;
  }
};

const getDifficultyType = (difficulty: number) => {
  const types = ["", "success", "warning", "danger"];
  return types[difficulty] || "info";
};

const getDifficultyText = (difficulty: number) => {
  const texts = ["", "简单", "中等", "困难"];
  return texts[difficulty] || "未知";
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const startTraining = (id: string) => {
  router.push(`/training/${id}`);
};

const goHome = () => {
  router.push("/home");
};

onMounted(() => {
  loadMaterials();
});
</script>

<style scoped>
.materials-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.nav {
  display: flex;
  align-items: center;
}

.nav .el-button {
  color: white;
  margin-right: 20px;
}

.nav .title {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.main {
  padding: 30px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.material-card {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.material-title {
  font-weight: bold;
  color: #303133;
}

.material-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  flex-grow: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category {
  color: #909399;
  font-size: 13px;
}
</style>
