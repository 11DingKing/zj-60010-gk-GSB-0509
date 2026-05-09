<template>
  <div class="training-container">
    <el-container v-if="!trainingStore.state.isFinished">
      <el-header class="header">
        <div class="header-left">
          <el-button type="text" @click="confirmExit">
            <el-icon><ArrowLeft /></el-icon>
            退出
          </el-button>
          <span class="title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <div class="timer">
            <el-icon><Timer /></el-icon>
            <span>{{ formatTime(totalTime) }}</span>
          </div>
          <div class="progress">
            <span
              >第 {{ trainingStore.state.currentIndex + 1 }} /
              {{ trainingStore.totalQuestions }} 题</span
            >
            <el-progress
              :percentage="trainingStore.progress"
              :stroke-width="10"
              style="width: 200px; margin-left: 16px"
            />
          </div>
        </div>
      </el-header>

      <el-main class="main" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card v-if="showMaterial" class="material-card">
              <template #header>
                <div class="card-header">
                  <span>材料内容</span>
                  <el-button
                    type="text"
                    @click="showMaterial = false"
                    v-if="trainingStore.state.mode !== 'challenge'"
                  >
                    收起材料
                  </el-button>
                </div>
              </template>

              <div class="material-content">
                <h3>{{ trainingStore.state.material?.title }}</h3>
                <p class="text-content">
                  {{ trainingStore.state.material?.content }}
                </p>

                <TableRenderer
                  v-if="trainingStore.state.material?.tableData"
                  :table-data="trainingStore.state.material.tableData"
                />
              </div>
            </el-card>

            <el-button
              v-else-if="trainingStore.state.material"
              type="primary"
              plain
              @click="showMaterial = true"
              class="show-material-btn"
            >
              <el-icon><Document /></el-icon>
              查看材料
            </el-button>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="question-section">
          <el-col :span="24">
            <el-card class="question-card">
              <template #header>
                <div class="question-header">
                  <el-tag
                    :type="getSkillTagType(currentQuestion?.skillType)"
                    size="large"
                  >
                    {{ getSkillTypeName(currentQuestion?.skillType) }}
                  </el-tag>
                  <div class="question-timer">
                    <el-icon><Stopwatch /></el-icon>
                    <span>本题用时：{{ formatTime(questionTime) }}</span>
                  </div>
                </div>
              </template>

              <div class="question-content" v-if="currentQuestion">
                <h4 class="question-text">
                  <span class="q-index"
                    >{{ trainingStore.state.currentIndex + 1 }}.</span
                  >
                  {{ currentQuestion.questionText }}
                </h4>

                <div class="options">
                  <el-radio-group v-model="selectedAnswer" size="large">
                    <el-radio
                      v-for="(option, index) in currentQuestion.options"
                      :key="index"
                      :label="index"
                      class="option-item"
                    >
                      <span class="option-label"
                        >{{ String.fromCharCode(65 + index) }}.</span
                      >
                      <span class="option-value">{{ option }}</span>
                    </el-radio>
                  </el-radio-group>
                </div>
              </div>

              <template #footer>
                <div class="question-footer">
                  <el-button
                    type="primary"
                    size="large"
                    :disabled="selectedAnswer === null"
                    @click="submitAnswer"
                  >
                    {{ isLastQuestion ? "提交答案" : "下一题" }}
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <div class="result-container" v-else>
      <el-result
        icon="success"
        title="答题完成！"
        :sub-title="`共 ${trainingStore.state.results.length} 题，正确 ${correctCount} 题，正确率 ${(accuracy * 100).toFixed(1)}%`"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">返回首页</el-button>
          <el-button @click="viewWrongAnswers">查看错题</el-button>
        </template>
      </el-result>

      <div class="result-details">
        <el-card
          v-for="(result, index) in trainingStore.state.results"
          :key="index"
        >
          <template #header>
            <div class="result-header">
              <span class="result-index">第 {{ index + 1 }} 题</span>
              <el-tag :type="result.isCorrect ? 'success' : 'danger'">
                {{ result.isCorrect ? "正确" : "错误" }}
              </el-tag>
              <span class="result-time">用时 {{ result.timeSpent }} 秒</span>
            </div>
          </template>

          <div class="result-content">
            <p class="question-text">
              {{ getQuestionText(result.questionId) }}
            </p>

            <div class="answers">
              <div class="answer-row">
                <span class="label">你的答案：</span>
                <span :class="result.isCorrect ? 'correct' : 'wrong'">
                  {{ String.fromCharCode(65 + result.userAnswer) }}
                </span>
              </div>
              <div class="answer-row">
                <span class="label">正确答案：</span>
                <span class="correct">
                  {{ String.fromCharCode(65 + result.correctAnswer) }}
                </span>
              </div>
            </div>

            <el-collapse v-if="!result.isCorrect">
              <el-collapse-item title="查看详细解析" name="1">
                <div class="explanation">
                  <h4>公式：</h4>
                  <p class="formula">{{ result.formula }}</p>

                  <h4>计算过程：</h4>
                  <p class="calculation">{{ result.calculation }}</p>

                  <h4>速算技巧：</h4>
                  <p class="tip">{{ result.tip }}</p>

                  <h4>详细说明：</h4>
                  <p>{{ result.explanation }}</p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="exitDialogVisible" title="确认退出" width="400px">
      <p>确定要退出当前训练吗？已答题目将不会保存。</p>
      <template #footer>
        <el-button @click="exitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="exitTraining">确认退出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Timer,
  Stopwatch,
  Document,
  ArrowRight,
} from "@element-plus/icons-vue";
import { useTrainingStore } from "@/stores/training";
import { materialApi, trainingApi } from "@/api";
import TableRenderer from "@/components/TableRenderer.vue";
import {
  SkillType,
  SkillTypeNames,
  type Question,
  type AnswerResult,
} from "@/types";

const router = useRouter();
const route = useRoute();
const trainingStore = useTrainingStore();

const loading = ref(false);
const exitDialogVisible = ref(false);
const showMaterial = ref(true);
const selectedAnswer = ref<number | null>(null);
const totalTime = ref(0);
const questionTime = ref(0);
let totalTimer: number | null = null;
let questionTimer: number | null = null;

const pageTitle = computed(() => {
  if (trainingStore.state.mode === "challenge") return "计时挑战模式";
  if (trainingStore.state.mode === "skill") {
    return `${SkillTypeNames[trainingStore.state.skillType as SkillType]} 专项训练`;
  }
  return "材料训练";
});

const currentQuestion = computed(() => trainingStore.currentQuestion);

const isLastQuestion = computed(
  () => trainingStore.state.currentIndex >= trainingStore.totalQuestions - 1,
);

const correctCount = computed(
  () => trainingStore.state.results.filter((r) => r.isCorrect).length,
);

const accuracy = computed(() =>
  trainingStore.state.results.length > 0
    ? correctCount.value / trainingStore.state.results.length
    : 0,
);

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getSkillTagType = (skillType?: SkillType) => {
  const types: Record<SkillType, string> = {
    [SkillType.GROWTH_RATE]: "primary",
    [SkillType.PROPORTION]: "success",
    [SkillType.MULTIPLE]: "warning",
    [SkillType.AVERAGE]: "danger",
    [SkillType.ANNUAL_GROWTH]: "info",
  };
  return types[skillType as SkillType] || "info";
};

const getSkillTypeName = (skillType?: SkillType) => {
  return SkillTypeNames[skillType as SkillType] || "未知";
};

const getQuestionText = (questionId: string) => {
  const q = trainingStore.state.questions.find((q) => q.id === questionId);
  return q?.questionText || "";
};

const startTimers = () => {
  totalTimer = window.setInterval(() => {
    totalTime.value++;
  }, 1000);

  questionTimer = window.setInterval(() => {
    questionTime.value++;
  }, 1000);
};

const stopTimers = () => {
  if (totalTimer) {
    clearInterval(totalTimer);
    totalTimer = null;
  }
  if (questionTimer) {
    clearInterval(questionTimer);
    questionTimer = null;
  }
};

const loadMaterial = async (id: string) => {
  loading.value = true;
  try {
    const material = await materialApi.getById(id);
    trainingStore.startMaterialTraining(material);
    showMaterial.value = true;
    startTimers();
  } catch (error) {
    ElMessage.error("加载材料失败");
    router.push("/materials");
  } finally {
    loading.value = false;
  }
};

const loadSkillQuestions = async (skillType: SkillType) => {
  loading.value = true;
  try {
    const questions = await materialApi.getBySkillType(skillType);
    if (questions.length === 0) {
      ElMessage.warning("该技巧暂无可用题目");
      router.push("/skills");
      return;
    }
    trainingStore.startSkillTraining(questions, skillType);
    showMaterial.value = false;
    startTimers();
  } catch (error) {
    ElMessage.error("加载题目失败");
    router.push("/skills");
  } finally {
    loading.value = false;
  }
};

const submitAnswer = () => {
  if (selectedAnswer.value === null) return;

  trainingStore.answerQuestion(selectedAnswer.value);

  if (isLastQuestion.value) {
    submitAll();
  } else {
    if (questionTimer) {
      clearInterval(questionTimer);
      questionTime.value = 0;
      questionTimer = window.setInterval(() => {
        questionTime.value++;
      }, 1000);
    }
    trainingStore.nextQuestion();
    selectedAnswer.value = null;
  }
};

const submitAll = async () => {
  stopTimers();

  const submitData = {
    materialId: trainingStore.state.material?.id,
    isChallenge: trainingStore.state.mode === "challenge",
    totalTime: totalTime.value,
    answers: trainingStore.state.answers,
  };

  loading.value = true;
  try {
    const result = await trainingApi.submit(submitData);
    trainingStore.finish(result.results);
  } catch (error) {
    ElMessage.error("提交失败");
  } finally {
    loading.value = false;
  }
};

const confirmExit = () => {
  exitDialogVisible.value = true;
};

const exitTraining = () => {
  stopTimers();
  trainingStore.reset();
  exitDialogVisible.value = false;

  if (trainingStore.state.mode === "challenge") {
    router.push("/home");
  } else if (trainingStore.state.mode === "skill") {
    router.push("/skills");
  } else {
    router.push("/materials");
  }
};

const goBack = () => {
  trainingStore.reset();
  router.push("/home");
};

const viewWrongAnswers = () => {
  trainingStore.reset();
  router.push("/wrong-answers");
};

onMounted(() => {
  const id = route.params.id as string;
  const skillType = route.params.skillType as SkillType;

  if (skillType && Object.values(SkillType).includes(skillType)) {
    loadSkillQuestions(skillType);
  } else if (id) {
    loadMaterial(id);
  }
});

onUnmounted(() => {
  stopTimers();
});
</script>

<style scoped>
.training-container {
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

.header-left {
  display: flex;
  align-items: center;
}

.header-left .el-button {
  color: white;
  margin-right: 20px;
}

.header-left .title {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  color: white;
  gap: 32px;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: bold;
}

.progress {
  display: flex;
  align-items: center;
}

.main {
  padding: 30px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.material-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.material-content h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.text-content {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 24px;
}

.table-wrapper {
  overflow-x: auto;
}

.show-material-btn {
  margin-bottom: 24px;
}

.question-section {
  margin-top: 20px;
}

.question-card {
  min-height: 400px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.question-content {
  padding: 16px 0;
}

.question-text {
  color: #303133;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.q-index {
  margin-right: 8px;
}

.options {
  margin-top: 24px;
}

.option-item {
  display: block;
  padding: 16px 20px;
  margin-bottom: 12px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
}

.option-item:hover {
  border-color: #409eff;
}

.option-label {
  font-weight: bold;
  margin-right: 12px;
  color: #606266;
}

.option-value {
  color: #303133;
}

.question-footer {
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.result-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 40px;
}

.result-details {
  max-width: 1000px;
  margin: 0 auto;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.result-index {
  font-weight: bold;
  color: #303133;
}

.result-time {
  color: #909399;
  margin-left: auto;
}

.result-content {
  padding: 8px 0;
}

.answers {
  margin: 16px 0;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.answer-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.answer-row:last-child {
  margin-bottom: 0;
}

.answer-row .label {
  color: #909399;
  width: 100px;
}

.answer-row .correct {
  color: #67c23a;
  font-weight: bold;
}

.answer-row .wrong {
  color: #f56c6c;
  font-weight: bold;
}

.explanation {
  padding: 16px;
  background-color: #ecf5ff;
  border-radius: 4px;
}

.explanation h4 {
  margin: 0 0 8px 0;
  color: #409eff;
  font-size: 14px;
}

.explanation p {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.6;
}

.explanation .formula {
  font-family: "Courier New", monospace;
  background-color: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

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
