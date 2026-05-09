<template>
  <div class="table-renderer-wrapper">
    <div
      class="table-scroll-container"
      v-if="tableData && tableData.headers && tableData.rows"
    >
      <el-table
        :data="formattedRows"
        border
        :header-cell-style="{
          backgroundColor: '#f5f7fa',
          fontWeight: 'bold',
          color: '#303133',
        }"
        style="width: 100%; min-width: 600px"
      >
        <el-table-column
          v-for="(header, index) in tableData.headers"
          :key="index"
          :prop="`col${index}`"
          :label="header"
          align="center"
          :min-width="getColumnMinWidth(header)"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="cell-content">
              {{ formatCellValue(row[`col${index}`]) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="暂无表格数据" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

const props = defineProps<{
  tableData: TableData | null | undefined;
}>();

const formattedRows = computed(() => {
  if (!props.tableData || !props.tableData.rows) {
    return [];
  }
  return props.tableData.rows.map((row) => {
    const obj: Record<string, string | number> = {};
    row.forEach((val, index) => {
      obj[`col${index}`] = val;
    });
    return obj;
  });
});

const getColumnMinWidth = (header: string): number => {
  const len = header.length;
  if (len <= 4) return 80;
  if (len <= 8) return 120;
  return 160;
};

const formatCellValue = (value: string | number): string => {
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  }
  return String(value);
};
</script>

<style scoped>
.table-renderer-wrapper {
  width: 100%;
}

.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.table-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.cell-content {
  font-size: 14px;
  color: #606266;
}
</style>
