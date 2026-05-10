<template>
  <div class="profile-container">
    <el-container>
      <el-header class="header">
        <div class="nav">
          <el-button type="text" @click="goHome">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <span class="title">个人中心</span>
        </div>
      </el-header>

      <el-main class="main" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card class="user-info-card">
              <el-descriptions title="用户信息" :column="3" border>
                <el-descriptions-item label="用户名">{{
                  user.username
                }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{
                  user.email || "未设置"
                }}</el-descriptions-item>
                <el-descriptions-item label="注册时间">{{
                  formatDate(user.createdAt)
                }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="stats-cards">
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-card class="stat-card">
              <div class="stat-icon primary">
                <el-icon size="32"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{
                  dashboardStats.totalTrainings || 0
                }}</span>
                <span class="stat-label">训练次数</span>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-card class="stat-card">
              <div class="stat-icon warning">
                <el-icon size="32"><Trophy /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{
                  dashboardStats.totalChallenges || 0
                }}</span>
                <span class="stat-label">挑战次数</span>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-card class="stat-card">
              <div class="stat-icon danger">
                <el-icon size="32"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{
                  dashboardStats.unresolvedWrongAnswers || 0
                }}</span>
                <span class="stat-label">待解决错题</span>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-card class="stat-card">
              <div class="stat-icon success">
                <el-icon size="32"><Medal /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ bestChallenge?.score || 0 }}</span>
                <span class="stat-label">最高得分</span>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-card class="stat-card">
              <div class="stat-icon streak">
                <el-icon size="32"><Calendar /></el-icon>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ dashboardStats.streakDays || 0 }}</span>
                <span class="stat-label">连续打卡(天)</span>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="charts-row">
          <el-col :xs="24" :lg="12">
            <el-card>
              <template #header>
                <span>各速算技巧正确率</span>
              </template>
              <div ref="accuracyChartRef" class="chart-container"></div>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-card>
              <template #header>
                <span>近20次训练平均用时趋势</span>
              </template>
              <div ref="timeChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="history-section">
          <el-col :xs="24" :lg="12">
            <el-card>
              <template #header>
                <span>挑战历史记录</span>
              </template>
              <el-table
                :data="challengeHistory"
                style="width: 100%"
                v-if="challengeHistory.length > 0"
              >
                <el-table-column prop="createdAt" label="时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column prop="score" label="得分" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getScoreType(row.score)" size="small">{{
                      row.score
                    }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="grade" label="等级" width="80">
                  <template #default="{ row }">
                    <el-tag
                      :type="getGradeType(row.grade)"
                      size="small"
                      effect="dark"
                      >{{ row.grade }}</el-tag
                    >
                  </template>
                </el-table-column>
                <el-table-column prop="accuracy" label="正确率">
                  <template #default="{ row }">
                    {{ (row.accuracy * 100).toFixed(1) }}%
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无挑战记录" />
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-card>
              <template #header>
                <span>各技巧训练统计</span>
              </template>
              <el-table
                :data="skillStats"
                style="width: 100%"
                v-if="skillStats.length > 0"
              >
                <el-table-column prop="skillType" label="技巧名称">
                  <template #default="{ row }">
                    {{ SkillTypeNames[row.skillType] }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="totalAttempts"
                  label="练习次数"
                  width="100"
                />
                <el-table-column prop="accuracy" label="正确率">
                  <template #default="{ row }">
                    <el-progress
                      :percentage="(row.accuracy * 100).toFixed(0)"
                      :stroke-width="10"
                      :color="getAccuracyColor(row.accuracy)"
                    />
                  </template>
                </el-table-column>
                <el-table-column
                  prop="avgTimePerQuestion"
                  label="平均用时(秒)"
                  width="120"
                >
                  <template #default="{ row }">
                    {{
                      row.totalAttempts > 0
                        ? row.avgTimePerQuestion.toFixed(1)
                        : "-"
                    }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无训练统计" />
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Document,
  Trophy,
  Warning,
  Medal,
  Calendar,
} from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { userApi } from "@/api";
import {
  SkillType,
  SkillTypeNames,
  type User,
  type SkillStats,
  type ChallengeRecord,
  type DashboardStats,
} from "@/types";

const router = useRouter();

const loading = ref(false);
const user = ref<User>({ id: "", username: "", createdAt: "" });
const dashboardStats = ref<DashboardStats>({
  totalTrainings: 0,
  totalChallenges: 0,
  unresolvedWrongAnswers: 0,
  skillStats: [],
  recentTrainings: [],
  streakDays: 0,
});
const challengeHistory = ref<ChallengeRecord[]>([]);
const skillStats = ref<SkillStats[]>([]);

const accuracyChartRef = ref<HTMLElement>();
const timeChartRef = ref<HTMLElement>();
let accuracyChart: echarts.ECharts | null = null;
let timeChart: echarts.ECharts | null = null;

const bestChallenge = computed(() => dashboardStats.value.bestChallenge);

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN");
};

const getScoreType = (score: number) => {
  if (score >= 90) return "success";
  if (score >= 80) return "primary";
  if (score >= 70) return "warning";
  return "danger";
};

const getGradeType = (grade: string) => {
  const types: Record<string, string> = {
    S: "success",
    A: "primary",
    B: "warning",
    C: "info",
    D: "danger",
  };
  return types[grade] || "danger";
};

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 0.8) return "#67c23a";
  if (accuracy >= 0.6) return "#e6a23c";
  return "#f56c6c";
};

const loadData = async () => {
  loading.value = true;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      user.value = JSON.parse(storedUser);
    }

    const [stats, history] = await Promise.all([
      userApi.getDashboardStats(),
      userApi.getChallengeHistory(),
    ]);

    dashboardStats.value = stats;
    challengeHistory.value = history;
    skillStats.value = stats.skillStats;
  } catch (error) {
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const initAccuracyChart = () => {
  if (!accuracyChartRef.value) return;

  accuracyChart = echarts.init(accuracyChartRef.value);

  const skillNames = skillStats.value.map((s) => SkillTypeNames[s.skillType]);
  const accuracies = skillStats.value.map((s) => (s.accuracy * 100).toFixed(1));

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: skillNames,
      axisLabel: {
        rotate: 30,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      name: "正确率(%)",
      max: 100,
    },
    series: [
      {
        name: "正确率",
        type: "bar",
        data: accuracies,
        itemStyle: {
          color: function (params: any) {
            const value = parseFloat(params.value);
            if (value >= 80) return "#67c23a";
            if (value >= 60) return "#e6a23c";
            return "#f56c6c";
          },
        },
        label: {
          show: true,
          position: "top",
          formatter: "{c}%",
        },
      },
    ],
  };

  accuracyChart.setOption(option);
};

const initTimeChart = () => {
  if (!timeChartRef.value) return;

  timeChart = echarts.init(timeChartRef.value);

  const recentTrainings = dashboardStats.value.recentTrainings
    .slice(0, 20)
    .reverse();
  const times = recentTrainings.map((t) => {
    if (t.totalCount > 0) {
      return (t.totalTime / t.totalCount).toFixed(1);
    }
    return "0";
  });
  const dates = recentTrainings.map((t, i) => `第${i + 1}次`);

  const option = {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: {
        interval: Math.floor(dates.length / 6),
      },
    },
    yAxis: {
      type: "value",
      name: "平均用时(秒)",
    },
    series: [
      {
        name: "平均用时",
        type: "line",
        data: times,
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(102, 126, 234, 0.5)" },
            { offset: 1, color: "rgba(102, 126, 234, 0.1)" },
          ]),
        },
        lineStyle: {
          color: "#667eea",
          width: 2,
        },
        itemStyle: {
          color: "#667eea",
        },
      },
    ],
  };

  timeChart.setOption(option);
};

const handleResize = () => {
  accuracyChart?.resize();
  timeChart?.resize();
};

const goHome = () => {
  router.push("/home");
};

onMounted(async () => {
  await loadData();
  await nextTick();
  initAccuracyChart();
  initTimeChart();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  accuracyChart?.dispose();
  timeChart?.dispose();
});
</script>

<style scoped>
.profile-container {
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

.user-info-card {
  margin-bottom: 24px;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-card .el-card__body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.primary {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.stat-icon.success {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.stat-icon.warning {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.stat-icon.danger {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.stat-icon.streak {
  background-color: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.stat-content {
  text-align: left;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-bottom: 24px;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.history-section {
  margin-top: 20px;
}
</style>
