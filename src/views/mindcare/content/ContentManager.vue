<template>
  <div class="app-container mindcare-page">
    <div class="page-heading">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>{{ pageDescription }}</p>
      </div>
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['mindcare:content:add']">新增{{ typeLabel }}</el-button>
    </div>

    <el-form ref="queryRef" :model="query" :inline="true" class="filter-bar">
      <el-form-item label="标题" prop="title">
        <el-input v-model="query.title" placeholder="输入标题关键词" clearable @keyup.enter="search" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option label="已发布" value="0" />
          <el-option label="已下架" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="search">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="rows" row-key="contentId">
      <el-table-column label="排序" prop="sortOrder" width="72" align="center" />
      <el-table-column label="标题" prop="title" min-width="200" show-overflow-tooltip />
      <el-table-column label="内容标识" prop="contentKey" min-width="130" show-overflow-tooltip />
      <el-table-column label="分类" prop="category" width="130" />
      <el-table-column label="简介" prop="summary" min-width="260" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'" effect="plain">
            {{ scope.row.status === '0' ? '已发布' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" prop="updateTime" width="168">
        <template #default="scope">{{ scope.row.updateTime || scope.row.createTime || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleEdit(scope.row)" v-hasPermi="['mindcare:content:edit']">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['mindcare:content:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="query.pageNum" v-model:limit="query.pageSize" @pagination="load" />

    <el-dialog v-model="dialogOpen" :title="form.contentId ? `编辑${typeLabel}` : `新增${typeLabel}`" width="820px" append-to-body destroy-on-close>
      <el-alert title="保存后，已发布内容会在用户端下次同步时更新。内容配置使用 JSON，基础字段会在保存时自动同步。" type="info" :closable="false" show-icon class="dialog-tip" />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="标题" prop="title"><el-input v-model="form.title" maxlength="100" show-word-limit /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容标识" prop="contentKey"><el-input v-model="form.contentKey" placeholder="如 stress-management" :disabled="Boolean(form.contentId)" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category"><el-input v-model="form.category" /></el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="排序" prop="sortOrder"><el-input-number v-model="form.sortOrder" :min="0" :max="999" controls-position="right" /></el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" prop="status">
              <el-switch v-model="form.status" active-value="0" inactive-value="1" active-text="发布" inactive-text="下架" inline-prompt />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="简介" prop="summary"><el-input v-model="form.summary" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容配置" prop="payloadJson">
              <div class="json-field">
                <div class="json-actions">
                  <span>必须为合法 JSON 对象，且 <code>id</code> 与内容标识一致</span>
                  <el-button link type="primary" @click="formatJson">格式化</el-button>
                </div>
                <el-input v-model="form.payloadJson" type="textarea" :rows="14" spellcheck="false" class="json-editor" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { addContent, deleteContent, getContent, listContent, updateContent } from '@/api/mindcare'

const props = defineProps({
  contentType: { type: String, required: true },
  pageTitle: { type: String, required: true },
  pageDescription: { type: String, required: true },
  typeLabel: { type: String, required: true }
})

const { proxy } = getCurrentInstance()
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const rows = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, contentType: props.contentType, title: undefined, status: undefined })
const form = reactive(emptyForm())
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  contentKey: [
    { required: true, message: '请输入内容标识', trigger: 'blur' },
    { pattern: /^[a-z0-9][a-z0-9-]*$/, message: '仅支持小写字母、数字和连字符', trigger: 'blur' }
  ],
  payloadJson: [{ required: true, message: '请输入内容配置', trigger: 'blur' }]
}

function emptyPayload() {
  const common = { id: '', title: '', category: '' }
  if (props.contentType === 'assessment') return { ...common, count: 1, minutes: 3, art: 'flowers', hero: 'rest', description: '', questions: ['请填写题目'] }
  if (props.contentType === 'course') return { ...common, minutes: 10, learners: '0', art: 'meadow', hero: 'video', teacher: '', intro: '', video: '', chapters: [{ title: '第一章', duration: '05:00' }] }
  return { ...common, date: '', time: '', location: '', capacity: 20, enrolled: 0, status: '报名中', art: 'walking', hero: 'forest', intro: '', schedule: [] }
}

function emptyForm() {
  return { contentId: undefined, contentKey: '', contentType: props.contentType, title: '', category: '', summary: '', payloadJson: JSON.stringify(emptyPayload(), null, 2), status: '0', sortOrder: 0 }
}

function assignForm(value) {
  Object.assign(form, emptyForm(), value)
  if (value?.payloadJson) {
    try { form.payloadJson = JSON.stringify(JSON.parse(value.payloadJson), null, 2) } catch (_) { /* show server value for repair */ }
  }
}

async function load() {
  loading.value = true
  try {
    const response = await listContent(query)
    rows.value = response.rows || []
    total.value = response.total || 0
  } finally {
    loading.value = false
  }
}

function search() { query.pageNum = 1; load() }
function resetQuery() { proxy.resetForm('queryRef'); query.contentType = props.contentType; search() }
function handleAdd() { assignForm(); dialogOpen.value = true }

async function handleEdit(row) {
  const response = await getContent(row.contentId)
  assignForm(response.data)
  dialogOpen.value = true
}

function formatJson() {
  try {
    form.payloadJson = JSON.stringify(JSON.parse(form.payloadJson), null, 2)
  } catch (_) {
    proxy.$modal.msgError('内容配置不是合法 JSON')
  }
}

async function submit() {
  await proxy.$refs.formRef.validate()
  let payload
  try { payload = JSON.parse(form.payloadJson) } catch (_) { proxy.$modal.msgError('内容配置不是合法 JSON'); return }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    proxy.$modal.msgError('内容配置必须是 JSON 对象')
    return
  }
  payload.id = form.contentKey
  payload.title = form.title
  payload.category = form.category
  if ('description' in payload) payload.description = form.summary
  if ('intro' in payload) payload.intro = form.summary
  const data = { ...form, contentType: props.contentType, payloadJson: JSON.stringify(payload) }
  saving.value = true
  try {
    if (form.contentId) await updateContent(data)
    else await addContent(data)
    proxy.$modal.msgSuccess('保存成功')
    dialogOpen.value = false
    load()
  } finally { saving.value = false }
}

function handleDelete(row) {
  proxy.$modal.confirm(`确认删除“${row.title}”吗？用户端之后将不再同步到该内容。`).then(async () => {
    await deleteContent(row.contentId)
    proxy.$modal.msgSuccess('删除成功')
    load()
  }).catch(() => {})
}

load()
</script>

<style scoped lang="scss">
.mindcare-page { color: #263c34; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h2 { margin: 0 0 7px; font-size: 22px; font-weight: 650; color: #263c34; }
.page-heading p { margin: 0; color: #6f7e77; line-height: 1.6; }
.filter-bar { padding: 16px 18px 0; margin-bottom: 16px; background: #f7f9f6; border: 1px solid #e5eae6; border-radius: 8px; }
.dialog-tip { margin-bottom: 20px; }
.json-field { width: 100%; }
.json-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; color: #7b8882; font-size: 12px; }
.json-editor :deep(textarea) { font-family: "Cascadia Code", Consolas, monospace; font-size: 13px; line-height: 1.55; }
</style>
