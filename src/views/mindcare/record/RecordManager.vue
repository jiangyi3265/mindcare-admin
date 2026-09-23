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
      <el-table-column label="结果" width="110" align="center">
        <template #default="scope"><span v-if="scope.row.score !== null && scope.row.score !== undefined">{{ scope.row.score }} 分</span><span v-else-if="scope.row.progress !== null && scope.row.progress !== undefined">{{ scope.row.progress }}%</span><span v-else>—</span></template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="120"><template #default="scope"><el-tag :type="statusMeta(scope.row.status).tag" effect="plain">{{ statusMeta(scope.row.status).label }}</el-tag></template></el-table-column>
      <el-table-column label="更新时间" prop="updateTime" width="170" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="scope"><el-button link type="primary" @click="showDetail(scope.row)">详情</el-button><el-button v-if="editable(scope.row)" link type="primary" @click="showStatus(scope.row)" v-hasPermi="['mindcare:record:edit']">处理</el-button></template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="query.pageNum" v-model:limit="query.pageSize" @pagination="load" />

    <el-drawer v-model="drawerOpen" title="业务记录详情" size="520px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="记录编号">{{ detail.recordKey }}</el-descriptions-item>
        <el-descriptions-item label="用户终端">{{ detail.clientId }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ typeMeta(detail.recordType).label }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ detail.title || '—' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detail.contactName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detail.contactPhone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusMeta(detail.status).label }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createTime || '—' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="detail" class="payload-block"><h4>业务明细</h4><pre>{{ prettyData(detail.dataJson) }}</pre></div>
    </el-drawer>

    <el-dialog v-model="statusOpen" title="更新处理状态" width="420px" append-to-body>
      <el-form label-width="80px"><el-form-item label="当前记录">{{ current?.title || current?.recordKey }}</el-form-item><el-form-item label="处理状态"><el-select v-model="nextStatus" style="width: 100%"><el-option v-for="item in actionStatuses" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-form>
      <template #footer><el-button @click="statusOpen = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveStatus">确认更新</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { getRecord, listRecords, updateRecordStatus } from '@/api/mindcare'

const props = defineProps({ fixedType: { type: String, default: '' }, pageTitle: { type: String, required: true }, pageDescription: { type: String, required: true } })
const { proxy } = getCurrentInstance()
const loading = ref(false), saving = ref(false), drawerOpen = ref(false), statusOpen = ref(false)
const rows = ref([]), total = ref(0), detail = ref(null), current = ref(null), nextStatus = ref('pending')
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
function typeMeta(value) { return typeOptions.find(item => item.value === value) || { label: value || '其他', tag: 'info' } }
function statusMeta(value) { return statusOptions.find(item => item.value === value) || { label: value || '未知', tag: 'info' } }
function editable(row) { return ['consultation', 'activity', 'message'].includes(row.recordType) }
function prettyData(value) { if (!value) return '无'; try { return JSON.stringify(JSON.parse(value), null, 2) } catch (_) { return value } }
async function load() { loading.value = true; try { const response = await listRecords(query); rows.value = response.rows || []; total.value = response.total || 0 } finally { loading.value = false } }
function search() { query.pageNum = 1; load() }
function resetQuery() { proxy.resetForm('queryRef'); query.recordType = props.fixedType || undefined; search() }
async function showDetail(row) { const response = await getRecord(row.recordId); detail.value = response.data; drawerOpen.value = true }
function showStatus(row) { current.value = row; nextStatus.value = row.status === 'submitted' ? 'pending' : row.status; statusOpen.value = true }
async function saveStatus() { saving.value = true; try { await updateRecordStatus(current.value.recordId, nextStatus.value); proxy.$modal.msgSuccess('状态已更新'); statusOpen.value = false; load() } finally { saving.value = false } }
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
