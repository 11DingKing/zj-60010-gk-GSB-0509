<template>
  <div class="challenge-container">
    <el-container v-if="!isStarted && !isFinished">
      <el-header class="header">
        <div class="nav">
          <el-button type="text" @click="goHome">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <span class="title">计时挑战模式</span>
        </div>
      </el-header>

      <el-main class="main">
        <div class="start-screen">
          <el-card class="intro-card">
            <template #header>
              <div class="card-header">
                <el-icon size="48" color="#e6a23c"><Trophy /></el-icon>
                <div>
                  <h2>挑战模式说明</h2>
                  <p class="subtitle">测试你的速算能力，挑战高分！</p>
                </div>
              </div>
            </template>

            <div class="intro-content">
              <el-steps direction="vertical" :active="0">
                <el-step title="限时 8 分钟">
                  <template #description>
                    系统将随机抽取一套完整材料（包含 5 道题目），限时 8
                    分钟（480秒）完成。
                  </template>
                </el-step>
                <el-step title="综合评分规则">
                  <template #description>
                    <div class="scoring-rules">
                      <p><strong>权重分配：</strong>正确率 60% + 用时 40%</p>
                      <p>
                        <strong>S 级条件：</strong>正确率 ≥ 90% 且 用时 ≤
                        5分钟（300秒）
                      </p>
                      <p>
                        <strong>其他等级：</strong
                        >A(≥80分)、B(≥70分)、C(≥60分)、D(<60分)
                      </p>
                    </div>
                  </template>
                </el-step>
                <el-step title="用时计分说明">
                  <template #description>
                    <div class="time-scoring">
                      <p>• 用时 ≤ 5分钟（300秒）：得 40 分（满分）</p>
                      <p>• 用时 在 5-8分钟之间：线性递减</p>
                      <p>• 用时 ≥ 8分钟（480秒）：得 0 分</p>
                    </div>
                  </template>
                </el-step>
              </el-steps>
            </div>

            <template #footer>
              <div class="start-btn-wrapper">
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="startChallenge"
                >
                  <el-icon><VideoPlay /></el-icon>
                  开始挑战
                </el-button>
              </div>
            </template>
          </el-card>

          <el-card class="leaderboard-card">
            <template #header>
              <span>挑战排行榜</span>
            </template>

            <el-table
              :data="leaderboard"
              v-loading="leaderboardLoading"
              style="width: 100%"
            >
              <el-table-column
                prop="rank"
                label="排名"
                width="80"
                align="center"
              >
                <template #default="{ $index }">
                  <span v-if="$index < 3" class="top-rank">
                    <el-icon v-if="$index === 0" color="#ffd700"
                      ><Medal
                    /></el-icon>
                    <el-icon v-else-if="$index === 1" color="#c0c0c0"
                      ><Medal
                    /></el-icon>
                    <el-icon v-else-if="$index === 2" color="#cd7f32"
                      ><Medal
                    /></el-icon>
                    {{ $index + 1 }}
                  </span>
                  <span v-else>{{ $index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="user.username" label="用户" />
              <el-table-column
                prop="score"
                label="得分"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="getScoreType(row.score)"
                    >{{ row.score }}分</el-tag
                  >
                </template>
              </el-table-column>
              <el-table-column
                prop="grade"
                label="等级"
                width="80"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="getGradeType(row.grade)" effect="dark">{{
                    row.grade
                  }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="totalTime"
                label="用时"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  {{ formatTime(row.totalTime) }}
                </template>
              </el-table-column>
            </el-table>

            <el-empty
              v-if="!leaderboardLoading && leaderboard.length === 0"
              description="暂无挑战记录"
            />
          </el-card>
        </div>
      </el-main>
    </el-container>

    <el-container v-if="isStarted && !isFinished">
      <el-header class="challenge-header">
        <div class="header-left">
          <span class="mode-label">挑战模式</span>
        </div>
        <div class="header-center">
          <div
            class="countdown"
            :class="{
              warning: remainingTime < 120,
              danger: remainingTime < 60,
            }"
          >
            <el-icon><Timer /></el-icon>
            <span>{{ formatTime(remainingTime) }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="progress">
            <span>第 {{ trainingStore.state.currentIndex + 1 }} / 5 题</span>
            <el-progress
              :percentage="((trainingStore.state.currentIndex + 1) / 5) * 100"
              :stroke-width="8"
              style="width: 150px; margin-left: 16px"
            />
          </div>
        </div>
      </el-header>

      <el-main class="challenge-main" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card class="material-card">
              <template #header>
                <div class="card-header">
                  <span>材料内容</span>
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
                    {{ isLastQuestion ? "提交挑战" : "下一题" }}
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <div class="result-container" v-if="isFinished">
      <div class="result-screen">
        <el-result
          :icon="getResultIcon()"
          :title="`挑战${challengeResult?.challengeRecord.grade === 'D' ? '未通过' : '完成'}！`"
          :sub-title="`最终得分：${challengeResult?.challengeRecord.score} 分`"
        >
          <template #extra>
            <div class="grade-display">
              <span class="grade-label">综合等级</span>
              <el-tag
                :type="getGradeType(challengeResult?.challengeRecord.grade)"
                size="large"
                effect="dark"
                class="grade-tag"
              >
                {{ challengeResult?.challengeRecord.grade }}
              </el-tag>
            </div>

            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-value">{{
                  challengeResult?.challengeRecord.correctCount
                }}</span>
                <span class="stat-label">正确题数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value"
                  >{{
                    (challengeResult?.challengeRecord.accuracy * 100).toFixed(
                      1,
                    )
                  }}%</span
                >
                <span class="stat-label">正确率</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{
                  formatTime(challengeResult?.challengeRecord.totalTime || 0)
                }}</span>
                <span class="stat-label">用时</span>
              </div>
            </div>

            <div class="result-buttons">
              <el-button type="primary" @click="retryChallenge"
                >再次挑战</el-button
              >
              <el-button @click="goHome">返回首页</el-button>
            </div>
          </template>
        </el-result>

        <div class="result-details">
          <el-card>
            <template #header>
              <span>评分规则说明</span>
            </template>

            <div class="scoring-rules">
              <h4 class="rules-title">权重分配</h4>
              <div class="weight-row">
                <div class="weight-item">
                  <div class="weight-bar">
                    <div class="weight-fill" style="width: 60%"></div>
                  </div>
                  <span>正确率 <strong>60%</strong></span>
                </div>
                <div class="weight-item">
                  <div class="weight-bar">
                    <div class="weight-fill" style="width: 40%"></div>
                  </div>
                  <span>用时 <strong>40%</strong></span>
                </div>
              </div>

              <h4 class="rules-title">用时计分规则</h4>
              <div class="time-rules">
                <p>
                  • 用时 ≤ <strong>5分钟（300秒）</strong>：得 40 分（满分）
                </p>
                <p>• 用时 在 5-8分钟之间：线性递减得分</p>
                <p>• 用时 ≥ <strong>8分钟（480秒）</strong>：得 0 分</p>
              </div>

              <h4 class="rules-title">等级判定标准</h4>
              <div class="grade-rules">
                <div class="grade-rule-item">
                  <el-tag type="success" effect="dark" size="large">S</el-tag>
                  <span>正确率 ≥ 90% <strong>且</strong> 用时 ≤ 5分钟</span>
                </div>
                <div class="grade-rule-item">
                  <el-tag type="primary" effect="dark" size="large">A</el-tag>
                  <span>正确率 ≥ 80%</span>
                </div>
                <div class="grade-rule-item">
                  <el-tag type="warning" effect="dark" size="large">B</el-tag>
                  <span>正确率 ≥ 60%</span>
                </div>
                <div class="grade-rule-item">
                  <el-tag type="info" effect="dark" size="large">C</el-tag>
                  <span>正确率 ≥ 40%</span>
                </div>
                <div class="grade-rule-item">
                  <el-tag type="danger" effect="dark" size="large">D</el-tag>
                  <span>正确率 < 40%</span>
                </div>
              </div>
            </div>
          </el-card>

          <el-card>
            <template #header>
              <span>答题详情</span>
            </template>

            <div
              v-for="(result, index) in challengeResult?.results"
              :key="index"
              class="result-item"
            >
              <div class="result-header">
                <span class="result-index">第 {{ index + 1 }} 题</span>
                <el-tag
                  :type="result.isCorrect ? 'success' : 'danger'"
                  size="small"
                >
                  {{ result.isCorrect ? "正确" : "错误" }}
                </el-tag>
              </div>
              <div class="result-answers">
                <span
                  >你的答案：<span
                    :class="result.isCorrect ? 'correct' : 'wrong'"
                    >{{ String.fromCharCode(65 + result.userAnswer) }}</span
                  ></span
                >
                <span
                  >正确答案：<span class="correct">{{
                    String.fromCharCode(65 + result.correctAnswer)
                  }}</span></span
                >
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Trophy,
  VideoPlay,
  Timer,
  ArrowRight,
  Medal,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled,
} from "@element-plus/icons-vue";
import { useTrainingStore } from "@/stores/training";
import { materialApi, challengeApi } from "@/api";
import TableRenderer from "@/components/TableRenderer.vue";
import {
  SkillType,
  SkillTypeNames,
  type ChallengeRecord,
  type AnswerResult,
} from "@/types";

const router = useRouter();
const trainingStore = useTrainingStore();

const CHALLENGE_DURATION = 480;

const loading = ref(false);
const leaderboardLoading = ref(false);
const isStarted = ref(false);
const isFinished = ref(false);
const selectedAnswer = ref<number | null>(null);
const remainingTime = ref(CHALLENGE_DURATION);
const leaderboard = ref<any[]>([]);
const challengeResult = ref<{
  challengeRecord: ChallengeRecord;
  results: AnswerResult[];
} | null>(null);

let countdownTimer: number | null = null;
let questionTimer: number | null = null;
const questionStartTime = ref(0);

const currentQuestion = computed(() => trainingStore.currentQuestion);
const isLastQuestion = computed(
  () => trainingStore.state.currentIndex >= trainingStore.totalQuestions - 1,
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

const getScoreType = (score: number) => {
  if (score >= 90) return "success";
  if (score >= 80) return "primary";
  if (score >= 70) return "warning";
  return "danger";
};

const getGradeType = (grade?: string) => {
  const types: Record<string, string> = {
    S: "success",
    A: "primary",
    B: "warning",
    C: "info",
    D: "danger",
  };
  return types[grade || "D"] || "danger";
};

const getResultIcon = () => {
  const grade = challengeResult.value?.challengeRecord.grade;
  if (grade === "S" || grade === "A") return "success";
  if (grade === "B" || grade === "C") return "warning";
  return "error";
};

const loadLeaderboard = async () => {
  leaderboardLoading.value = true;
  try {
    leaderboard.value = await challengeApi.getLeaderboard(10);
  } catch (error) {
    console.error("加载排行榜失败");
  } finally {
    leaderboardLoading.value = false;
  }
};

const startChallenge = async () => {
  loading.value = true;
  try {
    const material = await materialApi.getRandom();
    trainingStore.startChallenge(material);

    isStarted.value = true;
    remainingTime.value = CHALLENGE_DURATION;
    questionStartTime.value = Date.now();

    countdownTimer = window.setInterval(() => {
      remainingTime.value--;
      if (remainingTime.value <= 0) {
        submitChallenge();
      }
    }, 1000);
  } catch (error) {
    ElMessage.error("加载材料失败");
  } finally {
    loading.value = false;
  }
};

const submitAnswer = () => {
  if (selectedAnswer.value === null) return;

  const timeSpent = Math.round((Date.now() - questionStartTime.value) / 1000);
  const question = currentQuestion.value;

  if (question) {
    trainingStore.state.answers.push({
      questionId: question.id,
      userAnswer: selectedAnswer.value,
      timeSpent,
    });
  }

  if (isLastQuestion.value) {
    submitChallenge();
  } else {
    trainingStore.nextQuestion();
    selectedAnswer.value = null;
    questionStartTime.value = Date.now();
  }
};

const submitChallenge = async () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  if (questionTimer) {
    clearInterval(questionTimer);
    questionTimer = null;
  }

  const usedTime = CHALLENGE_DURATION - remainingTime.value;

  const submitData = {
    materialId: trainingStore.state.material?.id,
    totalTime: usedTime,
    answers: trainingStore.state.answers,
  };

  loading.value = true;
  try {
    const result = await challengeApi.submit(submitData);
    challengeResult.value = result;
    isFinished.value = true;
    isStarted.value = false;
  } catch (error) {
    ElMessage.error("提交失败");
  } finally {
    loading.value = false;
  }
};

const retryChallenge = () => {
  trainingStore.reset();
  isFinished.value = false;
  isStarted.value = false;
  challengeResult.value = null;
  selectedAnswer.value = null;
  remainingTime.value = CHALLENGE_DURATION;
  startChallenge();
};

const goHome = () => {
  trainingStore.reset();
  router.push("/home");
};

onMounted(() => {
  loadLeaderboard();
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  if (questionTimer) {
    clearInterval(questionTimer);
  }
});
</script>

<style scoped>
.challenge-container {
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

.start-screen {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.intro-card,
.leaderboard-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin: 0;
}

.intro-content {
  padding: 20px 0;
}

.start-btn-wrapper {
  text-align: center;
  padding: 16px 0;
}

.top-rank {
  font-weight: bold;
}

.challenge-header {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.mode-label {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: bold;
  color: white;
}

.countdown.warning {
  color: #ffeb3b;
}

.countdown.danger {
  color: #ff1744;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.progress {
  display: flex;
  align-items: center;
  color: white;
}

.challenge-main {
  padding: 30px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.material-card {
  margin-bottom: 24px;
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

.question-section {
  margin-top: 20px;
}

.question-card {
  min-height: 350px;
}

.question-header {
  display: flex;
  align-items: center;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
}

.result-screen {
  max-width: 800px;
  margin: 0 auto;
}

.grade-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.grade-label {
  font-size: 16px;
  color: #606266;
}

.grade-tag {
  font-size: 24px;
  padding: 8px 24px;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-bottom: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.result-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}

.result-details {
  margin-top: 24px;
}

.result-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.result-item:last-child {
  border-bottom: none;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.result-index {
  font-weight: bold;
  color: #303133;
}

.result-answers {
  display: flex;
  gap: 32px;
}

.result-answers .correct {
  color: #67c23a;
  font-weight: bold;
}

.result-answers .wrong {
  color: #f56c6c;
  font-weight: bold;
}

.scoring-rules {
  padding: 8px 0;
}

.rules-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin: 20px 0 12px 0;
}

.rules-title:first-child {
  margin-top: 0;
}

.weight-row {
  display: flex;
  gap: 40px;
  margin-bottom: 8px;
}

.weight-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.weight-bar {
  width: 100%;
  height: 20px;
  background-color: #ebeef5;
  border-radius: 10px;
  overflow: hidden;
}

.weight-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  transition: width 0.3s;
}

.time-rules,
.grade-rules {
  color: #606266;
  line-height: 1.8;
}

.time-rules p {
  margin: 4px 0;
}

.grade-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grade-rule-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.grade-rule-item .el-tag {
  min-width: 50px;
  text-align: center;
}
</style>
