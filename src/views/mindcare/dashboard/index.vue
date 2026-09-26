<template>
  <div class="app-container dashboard-page">
    <div class="page-heading">
      <div>
        <h2>运营概览</h2>
        <p>汇总用户端同步内容与近期业务记录，数据来自 MindCare 后端。</p>
      </div>
      <el-button icon="Refresh" :loading="loading" @click="load">刷新数据</el-button>
    </div>

    <el-row :gutter="16" class="metrics" v-loading="loading">
      <el-col v-for="metric in metrics" :key="metric.key" :xs="12" :sm="8" :lg="6">
        <div class="metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ stats[metric.key] ?? 0 }}</strong>
          <small>{{ metric.hint }}</small>
        </div>
      </el-col>
    </el-row>

    <section class="section-block">
      <div class="section-title">
        <div><h3>近期业务动态</h3><p>用户端最近同步的测评、预约、课程、活动及留言。</p></div>
      </div>
      <el-table :data="recentRecords" v-loading="loading" empty-text="暂无业务记录">
        <el-table-column label="类型" prop="recordType" width="110">
          <template #default="scope"><el-tag effect="plain" :type="typeMeta(scope.row.recordType).tag">{{ typeMeta(scope.row.recordType).label }}</el-tag></template>
        </el-table-column>
        <el-table-column label="内容" prop="title" min-width="220" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.title || '未命名记录' }}</template>
        </el-table-column>
        <el-table-column label="用户终端" prop="clientId" min-width="190" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="120"><template #default="scope"><el-tag v-if="scope.row.riskLevel && scope.row.riskLevel !== 'normal'" type="danger" effect="dark">预警</el-tag><span v-else>{{ statusText(scope.row.status) }}</span></template></el-table-column>
        <el-table-column label="更新时间" prop="updateTime" width="170" />
      </el-table>
    </section>
  </div>
</template>

<script setup name="MindcareDashboard">
import { getDashboard } from '@/api/mindcare'

const loading = ref(false)
const stats = ref({})
const recentRecords = ref([])
const metrics = [
  { key: 'clientCount', label: '用户终端', hint: '已建立同步身份' },
  { key: 'assessmentRecordCount', label: '完成测评', hint: '用户端测评记录' },
  { key: 'crisisRecordCount', label: '测评预警', hint: '累计风险信号' },
  { key: 'pendingRiskCount', label: '待处理预警', hint: '需要人工跟进' },
  { key: 'pendingConsultationCount', label: '待处理预约', hint: '需要尽快跟进' },
  { key: 'activityEnrollmentCount', label: '活动报名', hint: '累计报名记录' },
  { key: 'assessmentCount', label: '已发布量表', hint: '用户端当前可见' },
  { key: 'courseCount', label: '已发布课程', hint: '用户端当前可见' },
  { key: 'activityCount', label: '已发布活动', hint: '用户端当前可见' }
]
const types = {
  assessment: { label: '测评', tag: 'success' }, consultation: { label: '预约', tag: 'warning' },
  course: { label: '课程', tag: 'primary' }, activity: { label: '活动', tag: '' }, message: { label: '留言', tag: 'info' }
}
const statuses = { submitted: '已提交', pending: '待处理', confirmed: '已确认', canceled: '已取消', completed: '已完成', in_progress: '进行中' }
function typeMeta(type) { return types[type] || { label: type || '其他', tag: 'info' } }
function statusText(status) { return statuses[status] || status || '—' }
async function load() {
  loading.value = true
  try {
    const response = await getDashboard()
    stats.value = response.data?.stats || {}
    recentRecords.value = response.data?.recentRecords || []
  } finally { loading.value = false }
}
load()
</script>

<style scoped lang="scss">
.dashboard-page { color: #263c34; }
.page-heading, .section-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.page-heading { margin-bottom: 22px; }
h2, h3 { margin: 0 0 7px; color: #263c34; font-weight: 650; }
h2 { font-size: 22px; } h3 { font-size: 17px; }
p { margin: 0; color: #718078; line-height: 1.6; }
.metrics { row-gap: 16px; }
.metric-card { min-height: 124px; padding: 19px 20px; border: 1px solid #e2e8e3; border-radius: 9px; background: #fff; }
.metric-card span { display: block; color: #617068; font-size: 14px; }
.metric-card strong { display: block; margin: 10px 0 4px; color: #31493f; font-size: 28px; line-height: 1; }
.metric-card small { color: #8b9690; }
.section-block { margin-top: 24px; padding: 20px; border: 1px solid #e2e8e3; border-radius: 9px; background: #fff; }
.section-title { margin-bottom: 16px; }
</style>
