<template>
  <div class="wrong-answers-container">
    <el-container>
      <el-header class="header">
        <div class="nav">
          <el-button type="text" @click="goHome">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <span class="title">错题回顾</span>
        </div>
      </el-header>

      <el-main class="main">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card class="filter-card">
              <div class="filter-content">
                <div class="filter-left">
                  <span class="filter-label">技巧分类：</span>
                  <el-tabs
                    v-model="activeTab"
                    type="card"
                    @tab-change="onTabChange"
                    class="skill-tabs"
                  >
                    <el-tab-pane label="全部" name="all">
                      <template #label>
                        <span class="tab-label">全部</span>
                      </template>
                    </el-tab-pane>
                    <el-tab-pane
                      v-for="(name, type) in SkillTypeNames"
                      :key="type"
                      :label="name"
                      :name="type"
                    >
                      <template #label>
                        <span class="tab-label">{{ name }}</span>
                      </template>
                    </el-tab-pane>
                  </el-tabs>
                </div>
                <div class="filter-right">
                  <span class="filter-label">状态：</span>
                  <el-radio-group
                    v-model="filterForm.isResolved"
                    @change="loadWrongAnswers"
                    size="small"
                  >
                    <el-radio-button :label="undefined">全部</el-radio-button>
                    <el-radio-button :label="false">未解决</el-radio-button>
                    <el-radio-button :label="true">已解决</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="list-section">
          <el-col :span="24">
            <el-card v-loading="loading">
              <el-empty
                v-if="!loading && wrongAnswers.length === 0"
                :description="
                  filterForm.skillType ? '该技巧暂无错题' : '暂无错题记录'
                "
              />

              <div v-else class="wrong-answer-list">
                <div
                  v-for="(item, index) in wrongAnswers"
                  :key="item.id"
                  class="wrong-answer-item"
                >
                  <div class="item-header">
                    <div class="header-left">
                      <el-tag
                        :type="getSkillTagType(item.question.skillType)"
                        size="small"
                      >
                        {{ SkillTypeNames[item.question.skillType] }}
                      </el-tag>
                      <el-tag
                        v-if="item.isResolved"
                        type="success"
                        size="small"
                        effect="dark"
                        >已解决</el-tag
                      >
                      <span class="time"
                        >记录时间：{{ formatDate(item.createdAt) }}</span
                      >
                    </div>
                    <div class="header-right">
                      <el-button
                        v-if="!item.isResolved"
                        type="primary"
                        size="small"
                        @click="resolveWrongAnswer(item.id, index)"
                      >
                        标记已解决
                      </el-button>
                    </div>
                  </div>

                  <div class="item-content">
                    <div class="question-info">
                      <h4 class="question-text">
                        <span class="q-index">{{ index + 1 }}.</span>
                        {{ item.question.questionText }}
                      </h4>

                      <div class="options">
                        <div
                          v-for="(option, optIndex) in item.question.options"
                          :key="optIndex"
                          class="option-row"
                          :class="{
                            'user-answer': optIndex === item.userAnswer,
                            'correct-answer': optIndex === item.correctAnswer,
                          }"
                        >
                          <span class="option-label"
                            >{{ String.fromCharCode(65 + optIndex) }}.</span
                          >
                          <span class="option-value">{{ option }}</span>
                          <el-icon
                            v-if="optIndex === item.correctAnswer"
                            class="correct-icon"
                            ><CircleCheck
                          /></el-icon>
                          <el-icon
                            v-if="
                              optIndex === item.userAnswer &&
                              optIndex !== item.correctAnswer
                            "
                            class="wrong-icon"
                            ><CircleClose
                          /></el-icon>
                        </div>
                      </div>
                    </div>

                    <el-collapse>
                      <el-collapse-item title="查看材料内容" name="material">
                        <div class="material-preview">
                          <h5>{{ item.question.material?.title }}</h5>
                          <p class="material-text">
                            {{
                              truncateText(
                                item.question.material?.content || "",
                                300,
                              )
                            }}
                          </p>
                          <TableRenderer
                            v-if="item.question.material?.tableData"
                            :table-data="item.question.material.tableData"
                          />
                        </div>
                      </el-collapse-item>

                      <el-collapse-item title="查看详细解析" name="explanation">
                        <div class="explanation">
                          <h5>公式：</h5>
                          <p class="formula">{{ item.question.formula }}</p>

                          <h5>计算过程：</h5>
                          <p class="calculation">
                            {{ item.question.calculation }}
                          </p>

                          <h5>速算技巧：</h5>
                          <p class="tip">{{ item.question.tip }}</p>

                          <h5>详细说明：</h5>
                          <p>{{ item.question.explanation }}</p>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, CircleCheck, CircleClose } from "@element-plus/icons-vue";
import { trainingApi } from "@/api";
import TableRenderer from "@/components/TableRenderer.vue";
import {
  SkillType,
  SkillTypeNames,
  type WrongAnswer,
  type TableData,
} from "@/types";

const router = useRouter();

const loading = ref(false);
const wrongAnswers = ref<WrongAnswer[]>([]);
const activeTab = ref<string>("all");

const filterForm = reactive({
  skillType: undefined as SkillType | undefined,
  isResolved: undefined as boolean | undefined,
});

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN");
};

const getSkillTagType = (skillType: SkillType) => {
  const types: Record<SkillType, string> = {
    [SkillType.GROWTH_RATE]: "primary",
    [SkillType.PROPORTION]: "success",
    [SkillType.MULTIPLE]: "warning",
    [SkillType.AVERAGE]: "danger",
    [SkillType.ANNUAL_GROWTH]: "info",
  };
  return types[skillType] || "info";
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const onTabChange = (tabName: string) => {
  if (tabName === "all") {
    filterForm.skillType = undefined;
  } else {
    filterForm.skillType = tabName as SkillType;
  }
  loadWrongAnswers();
};

const loadWrongAnswers = async () => {
  loading.value = true;
  try {
    wrongAnswers.value = await trainingApi.getWrongAnswers(
      filterForm.skillType,
      filterForm.isResolved,
    );
  } catch (error) {
    ElMessage.error("加载错题失败");
  } finally {
    loading.value = false;
  }
};

const resolveWrongAnswer = async (id: string, index: number) => {
  try {
    await trainingApi.resolveWrongAnswer(id);
    wrongAnswers.value[index].isResolved = true;
    wrongAnswers.value[index].resolvedAt = new Date().toISOString();
    ElMessage.success("已标记为已解决");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const goHome = () => {
  router.push("/home");
};

onMounted(() => {
  loadWrongAnswers();
});
</script>

<style scoped>
.wrong-answers-container {
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

.filter-card {
  margin-bottom: 24px;
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-left,
.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.skill-tabs {
  flex-grow: 1;
}

.skill-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.skill-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tab-label {
  padding: 0 8px;
}

.list-section {
  margin-top: 20px;
}

.wrong-answer-list {
  padding: 8px 0;
}

.wrong-answer-item {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.wrong-answer-item:last-child {
  border-bottom: none;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time {
  color: #909399;
  font-size: 13px;
}

.item-content {
  padding-left: 8px;
}

.question-info {
  margin-bottom: 16px;
}

.question-text {
  color: #303133;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.q-index {
  margin-right: 8px;
  color: #409eff;
}

.options {
  margin-top: 12px;
}

.option-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
}

.option-row.user-answer {
  background-color: #fef0f0;
  border-color: #fbc4c4;
}

.option-row.correct-answer {
  background-color: #f0f9eb;
  border-color: #c2e7b0;
}

.option-label {
  font-weight: bold;
  margin-right: 12px;
  color: #606266;
}

.option-value {
  color: #303133;
  flex-grow: 1;
}

.correct-icon {
  color: #67c23a;
}

.wrong-icon {
  color: #f56c6c;
}

.material-preview {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.material-preview h5 {
  margin: 0 0 12px 0;
  color: #303133;
}

.material-text {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.table-wrapper {
  overflow-x: auto;
}

.explanation {
  padding: 16px;
  background-color: #ecf5ff;
  border-radius: 4px;
}

.explanation h5 {
  margin: 0 0 8px 0;
  color: #409eff;
  font-size: 14px;
}

.explanation p {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.6;
}

.explanation .formula,
.explanation .calculation {
  font-family: "Courier New", monospace;
  background-color: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.explanation .tip {
  color: #e6a23c;
  font-weight: 500;
}
</style>
