<template>
  <div class="app-container record-page">
    <div class="page-heading">
      <div><h2>{{ pageTitle }}</h2><p>{{ pageDescription }}</p></div>
      <el-button icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <el-form ref="queryRef" :model="query" :inline="true" class="filter-bar">
      <el-form-item v-if="!fixedType" label="类型" prop="recordType">
        <el-select v-model="query.recordType" placeholder="全部类型" clearable style="width: 140px">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词" prop="title"><el-input v-model="query.title" placeholder="标题关键词" clearable @keyup.enter="search" /></el-form-item>
      <el-form-item label="联系电话" prop="contactPhone"><el-input v-model="query.contactPhone" placeholder="联系电话" clearable @keyup.enter="search" /></el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="search">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-table :data="rows" v-loading="loading" empty-text="暂无匹配记录">
      <el-table-column label="类型" prop="recordType" width="105"><template #default="scope"><el-tag effect="plain" :type="typeMeta(scope.row.recordType).tag">{{ typeMeta(scope.row.recordType).label }}</el-tag></template></el-table-column>
      <el-table-column label="内容" prop="title" min-width="190" show-overflow-tooltip><template #default="scope">{{ scope.row.title || '未命名记录' }}</template></el-table-column>
      <el-table-column label="联系人" prop="contactName" width="120"><template #default="scope">{{ scope.row.contactName || '—' }}</template></el-table-column>
      <el-table-column label="联系电话" prop="contactPhone" width="145"><template #default="scope">{{ scope.row.contactPhone || '—' }}</template></el-table-column>
      <el-table-column label="结果" width="170" align="center">
        <template #default="scope"><span v-if="scope.row.recordType === 'assessment' && scope.row.isExploratory" class="muted">已完成体验题组（非标准分）</span><span v-else-if="scope.row.score !== null && scope.row.score !== undefined">{{ scope.row.score }} 分</span><span v-else-if="scope.row.progress !== null && scope.row.progress !== undefined">{{ scope.row.progress }}%</span><span v-else>—</span></template>
      </el-table-column>
      <el-table-column label="风险信号" width="110" align="center"><template #default="scope"><el-tag v-if="scope.row.riskLevel && scope.row.riskLevel !== 'normal'" type="danger">{{ scope.row.riskLevel === 'high' ? '高风险' : '需关注' }}</el-tag><span v-else class="muted">正常</span></template></el-table-column>
      <el-table-column label="状态" prop="status" width="120"><template #default="scope"><el-tag :type="statusMeta(scope.row.status).tag" effect="plain">{{ statusMeta(scope.row.status).label }}</el-tag></template></el-table-column>
      <el-table-column label="更新时间" prop="updateTime" width="170" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="scope"><el-button link type="primary" @click="showDetail(scope.row)">详情</el-button><el-button v-if="editable(scope.row)" link type="primary" @click="showStatus(scope.row)" v-hasPermi="['mindcare:record:edit']">处理</el-button></template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="query.pageNum" v-model:limit="query.pageSize" @pagination="load" />

    <el-drawer v-model="drawerOpen" :title="detail && isRiskRecord(detail) ? '测评预警详情' : '业务记录详情'" size="min(560px, 100vw)">
      <el-alert v-if="detail && isRiskRecord(detail)" title="这条测评已触发风险预警，请按平台流程完成跟进并记录处理结果。" type="warning" :closable="false" show-icon class="risk-alert" />
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="记录编号">{{ detail.recordKey }}</el-descriptions-item>
        <el-descriptions-item label="用户终端">{{ detail.clientId }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ typeMeta(detail.recordType).label }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ detail.title || '—' }}</el-descriptions-item>
        <el-descriptions-item label="提交姓名（未核验）">{{ detail.contactName || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="提交电话（未核验）">{{ detail.contactPhone || '未填写' }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.profileNickname" label="账号昵称（非实名）">{{ detail.profileNickname }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.profilePhone" label="登录手机号（未核验）">{{ detail.profilePhone }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.recordType === 'assessment'" label="测评时间">{{ assessmentTime(detail) }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.recordType === 'consultation'" label="预约时间">{{ appointmentTime(detail) }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.recordType === 'assessment' && detail.isExploratory" label="测评结果">已完成体验题组，不生成标准心理测量分数</el-descriptions-item>
        <el-descriptions-item v-else-if="detail.score !== null && detail.score !== undefined" label="测评得分"><span :class="{ 'risk-text': isRiskRecord(detail) }">{{ detail.score }} 分</span></el-descriptions-item>
        <el-descriptions-item v-if="isRiskRecord(detail)" label="风险等级"><el-tag type="danger">{{ detail.riskLevel === 'high' ? '高风险' : '需关注' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusMeta(detail.status).label }}</el-descriptions-item>
        <el-descriptions-item v-if="isRiskRecord(detail)" label="预警说明"><span class="risk-text">{{ detail.riskReason || '测评结果提示需要关注' }}</span></el-descriptions-item>
        <el-descriptions-item v-if="detail.handlingMethod" label="处理方式">{{ handlingMethodLabel(detail.handlingMethod) }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.handlingNote" label="处理备注">{{ detail.handlingNote }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.handlingTime" label="处理时间">{{ detail.handlingTime }}</el-descriptions-item>
        <el-descriptions-item :label="detail.recordType === 'assessment' ? '上传时间' : '创建时间'">{{ detail.createTime || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-collapse v-if="detail" class="payload-block"><el-collapse-item :title="detail.isExploratory ? '查看作答明细（不展示非标准分）' : '查看原始业务明细'" name="payload"><pre>{{ prettyData(detail.dataJson, detail.isExploratory) }}</pre></el-collapse-item></el-collapse>
    </el-drawer>

    <el-dialog v-model="statusOpen" title="处理预警 / 业务记录" width="min(560px, calc(100vw - 24px))" append-to-body destroy-on-close>
      <el-alert v-if="current && isRiskRecord(current)" title="请在处理备注中记录回访结果、用户反馈和后续安排。" type="info" :closable="false" show-icon class="dialog-tip" />
      <el-form :model="handlingForm" label-width="90px">
        <el-form-item label="当前记录">{{ current?.title || current?.recordKey }}</el-form-item>
        <el-form-item label="处理状态"><el-select v-model="handlingForm.status" style="width: 100%"><el-option v-for="item in availableActionStatuses" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="处理方式" :required="requiresFollowUp"><el-radio-group v-model="handlingForm.method"><el-radio-button v-for="item in handlingMethods" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="处理备注" :required="requiresFollowUp"><el-input v-model="handlingForm.note" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="例如：已电话回访，用户表示当前安全；约定 3 天后再次联系。" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="statusOpen = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveStatus">确认更新</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { getRecord, listRecords, updateRecordStatus } from '@/api/mindcare'

const props = defineProps({ fixedType: { type: String, default: '' }, pageTitle: { type: String, required: true }, pageDescription: { type: String, required: true } })
const { proxy } = getCurrentInstance()
const loading = ref(false), saving = ref(false), drawerOpen = ref(false), statusOpen = ref(false)
const rows = ref([]), total = ref(0), detail = ref(null), current = ref(null)
const handlingForm = reactive({ status: 'pending', method: 'phone', note: '' })
const query = reactive({ pageNum: 1, pageSize: 10, recordType: props.fixedType || undefined, title: undefined, contactPhone: undefined, status: undefined })
const typeOptions = [
  { value: 'assessment', label: '心理测评', tag: 'success' }, { value: 'consultation', label: '咨询预约', tag: 'warning' },
  { value: 'course', label: '课程学习', tag: 'primary' }, { value: 'activity', label: '活动报名', tag: '' }, { value: 'message', label: '用户留言', tag: 'info' }
]
const statusOptions = [
  { value: 'submitted', label: '已提交', tag: 'warning' }, { value: 'pending', label: '待处理', tag: 'warning' },
  { value: 'confirmed', label: '已确认', tag: 'success' }, { value: 'canceled', label: '已取消', tag: 'info' },
  { value: 'completed', label: '已完成', tag: 'success' }, { value: 'in_progress', label: '进行中', tag: 'primary' }
]
const actionStatuses = statusOptions.filter(item => ['pending', 'confirmed', 'canceled', 'completed'].includes(item.value))
const availableActionStatuses = computed(() => isRiskRecord(current.value) ? actionStatuses.filter(item => ['pending', 'completed'].includes(item.value)) : actionStatuses)
const requiresFollowUp = computed(() => ['completed', 'confirmed'].includes(handlingForm.status))
const handlingMethods = [
  { value: 'phone', label: '电话回访' }, { value: 'message', label: '信息回访' },
  { value: 'in_person', label: '线下面谈' }, { value: 'referral', label: '转介专业机构' }, { value: 'other', label: '其他' }
]
function typeMeta(value) { return typeOptions.find(item => item.value === value) || { label: value || '其他', tag: 'info' } }
function statusMeta(value) { return statusOptions.find(item => item.value === value) || { label: value || '未知', tag: 'info' } }
function editable(row) { return ['consultation', 'activity', 'message'].includes(row.recordType) || (row.recordType === 'assessment' && row.riskLevel && row.riskLevel !== 'normal') }
function prettyData(value, isExploratory = false) {
  if (!value) return '无'
  try {
    const data = typeof value === 'string' ? JSON.parse(value) : value
    if (isExploratory && data && typeof data === 'object' && !Array.isArray(data)) {
      const withoutScore = { ...data }
      delete withoutScore.score
      return JSON.stringify(withoutScore, null, 2)
    }
    return JSON.stringify(data, null, 2)
  } catch (_) { return isExploratory ? '非标准题组明细暂不可展示' : value }
}
function parseData(value) { if (!value) return {}; try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return parsed && typeof parsed === 'object' ? parsed : {} } catch (_) { return {} } }
function isRiskRecord(record) { return Boolean(record?.riskLevel && record.riskLevel !== 'normal') }
function assessmentTime(record) {
  const data = parseData(record?.dataJson)
  const localTime = [data.completedAt, data.assessedAt, data.submittedAt, data.date].find(value =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value.trim()) && !Number.isNaN(Date.parse(value.trim().replace(' ', 'T')))
  )
  return localTime || record?.createTime || '—'
}
function appointmentTime(record) { const data = parseData(record?.dataJson); const value = [data.date, data.time].filter(Boolean).join(' '); return value || record?.createTime || '—' }
function handlingMethodLabel(value) { return handlingMethods.find(item => item.value === value)?.label || value || '—' }
async function load() { loading.value = true; try { const response = await listRecords(query); rows.value = response.rows || []; total.value = response.total || 0 } finally { loading.value = false } }
function search() { query.pageNum = 1; load() }
function resetQuery() { proxy.resetForm('queryRef'); query.recordType = props.fixedType || undefined; search() }
async function showDetail(row) { const response = await getRecord(row.recordId); detail.value = response.data; drawerOpen.value = true }
function showStatus(row) {
  current.value = row
  handlingForm.status = isRiskRecord(row) ? (row.status === 'completed' ? 'completed' : 'pending') : (row.status === 'submitted' ? 'pending' : row.status)
  handlingForm.method = row.handlingMethod || ''
  handlingForm.note = row.handlingNote || ''
  statusOpen.value = true
}
async function saveStatus() {
  if (requiresFollowUp.value && !handlingForm.method) { proxy.$modal.msgError('确认或完成处理前，请选择处理方式'); return }
  if (requiresFollowUp.value && !handlingForm.note.trim()) { proxy.$modal.msgError('确认或完成处理前，请填写回访结果和后续安排'); return }
  saving.value = true
  try {
    await updateRecordStatus(current.value.recordId, { status: handlingForm.status, handlingMethod: handlingForm.method || null, handlingNote: handlingForm.note.trim() || null })
    proxy.$modal.msgSuccess('处理记录已保存')
    statusOpen.value = false
    load()
  } finally { saving.value = false }
}
load()
</script>

<style scoped lang="scss">
.record-page { color: #263c34; }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
h2 { margin: 0 0 7px; font-size: 22px; color: #263c34; } p { margin: 0; color: #718078; line-height: 1.6; }
.filter-bar { padding: 16px 18px 0; margin-bottom: 16px; background: #f7f9f6; border: 1px solid #e5eae6; border-radius: 8px; }
.payload-block { margin-top: 22px; } .payload-block h4 { margin: 0 0 10px; }
.payload-block pre { max-height: 440px; overflow: auto; padding: 14px; border-radius: 7px; background: #f5f7f5; color: #3c5047; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.55; }
</style>
