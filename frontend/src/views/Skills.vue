<template>
  <div class="skills-container">
    <el-container>
      <el-header class="header">
        <div class="nav">
          <el-button type="text" @click="goHome">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <span class="title">按技巧分类训练</span>
        </div>
      </el-header>

      <el-main class="main">
        <el-row :gutter="20">
          <el-col
            :xs="24"
            :sm="12"
            v-for="(skill, index) in skillList"
            :key="skill.type"
          >
            <el-card class="skill-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon :size="40" :color="skillColors[index]">
                    <component :is="skillIcon" />
                  </el-icon>
                  <div>
                    <h3>{{ skill.name }}</h3>
                    <span class="skill-desc">{{ skill.desc }}</span>
                  </div>
                </div>
              </template>

              <div class="skill-content">
                <p>{{ skill.detail }}</p>
              </div>

              <template #footer>
                <div class="card-footer">
                  <el-button
                    type="primary"
                    :loading="loadingSkills.has(skill.type)"
                    @click="startSkillTraining(skill.type)"
                  >
                    开始训练
                  </el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  TrendCharts,
  PieChart,
  Operation,
  DataAnalysis,
  Timer,
} from "@element-plus/icons-vue";
import { materialApi } from "@/api";
import { SkillType, SkillTypeNames } from "@/types";

const router = useRouter();

const loadingSkills = ref<Set<SkillType>>(new Set());

const skillColors = ["#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399"];

const skillList = [
  {
    type: SkillType.GROWTH_RATE,
    name: SkillTypeNames[SkillType.GROWTH_RATE],
    icon: markRaw(TrendCharts),
    desc: "增长率计算",
    detail:
      "掌握同比、环比增长率的计算方法，包括正向计算和反向推算基期值。常用公式：增长率=(现期-基期)/基期。",
  },
  {
    type: SkillType.PROPORTION,
    name: SkillTypeNames[SkillType.PROPORTION],
    icon: markRaw(PieChart),
    desc: "比重计算",
    detail:
      "计算部分值占整体值的百分比，包括基期比重、比重变化量、比重变化率的计算。",
  },
  {
    type: SkillType.MULTIPLE,
    name: SkillTypeNames[SkillType.MULTIPLE],
    icon: markRaw(Operation),
    desc: "倍数关系",
    detail:
      "计算两个数值之间的倍数关系，包括是几倍、多几倍的区分，以及基期倍数的计算。",
  },
  {
    type: SkillType.AVERAGE,
    name: SkillTypeNames[SkillType.AVERAGE],
    icon: markRaw(DataAnalysis),
    desc: "平均数计算",
    detail: "总量除以份数的平均数计算，包括平均数的增长率、两期平均数比较等。",
  },
  {
    type: SkillType.ANNUAL_GROWTH,
    name: SkillTypeNames[SkillType.ANNUAL_GROWTH],
    icon: markRaw(Timer),
    desc: "年均增长率",
    detail: "计算多年间的平均增长速率，包括年均增长率的估算和近似计算方法。",
  },
];

const startSkillTraining = async (skillType: SkillType) => {
  loadingSkills.value.add(skillType);
  try {
    const questions = await materialApi.getBySkillType(skillType);
    if (questions.length === 0) {
      ElMessage.warning("该技巧暂无可用题目");
      return;
    }
    router.push(`/skill-training/${skillType}`);
  } catch (error) {
    ElMessage.error("获取题目失败");
  } finally {
    loadingSkills.value.delete(skillType);
  }
};

const goHome = () => {
  router.push("/home");
};
</script>

<style scoped>
.skills-container {
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
  max-width: 1200px;
  margin: 0 auto;
}

.skill-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.skill-desc {
  color: #909399;
  font-size: 13px;
}

.skill-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.card-footer {
  text-align: right;
}
</style>
