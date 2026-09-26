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
      <el-alert title="保存后，已发布内容会在用户端下次同步时更新。量表和课程使用可视化表单，无需手写 JSON。" type="info" :closable="false" show-icon class="dialog-tip" />
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
          <template v-if="contentType === 'assessment'">
            <el-col :span="12"><el-form-item label="量表来源"><el-input v-model="form.sourceName" placeholder="如 WHO-5 / IPIP" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="来源链接"><el-input v-model="form.sourceUrl" placeholder="https://..." /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="授权说明"><el-input v-model="form.license" placeholder="如 CC BY-NC-SA 3.0 IGO" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="版本"><el-input v-model="form.version" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="预计时长"><el-input-number v-model="form.minutes" :min="1" :max="180" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="计分方式"><el-select v-model="form.scoringType"><el-option label="百分制" value="percent" /><el-option label="原始总分" value="sum" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="最高分"><el-input-number v-model="form.scoreMax" :min="1" :max="1000" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="选项"><div class="repeat-list"><div v-for="(item, index) in form.options" :key="index" class="repeat-row"><el-input v-model="form.options[index]" placeholder="选项文本" /><el-input-number v-model="form.optionValues[index]" :min="0" /><el-button link type="danger" @click="removeOption(index)" :disabled="form.options.length <= 2">删除</el-button></div><el-button link type="primary" @click="addOption">+ 添加选项</el-button></div></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="预警规则"><div class="risk-row"><el-select v-model="form.crisisDirection" style="width: 140px"><el-option label="不启用" value="none" /><el-option label="低于阈值" value="low" /><el-option label="高于阈值" value="high" /></el-select><el-input-number v-model="form.crisisThreshold" :disabled="form.crisisDirection === 'none'" :min="0" /><el-input v-model="form.crisisReason" :disabled="form.crisisDirection === 'none'" placeholder="触发后给用户的提示" /></div></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="题目"><div class="repeat-list"><div v-for="(item, index) in form.questions" :key="index" class="repeat-row question-row"><span class="question-index">{{ index + 1 }}</span><el-input v-model="form.questions[index]" placeholder="填写题目" /><el-button link type="danger" @click="removeQuestion(index)" :disabled="form.questions.length <= 1">删除</el-button></div><el-button link type="primary" @click="addQuestion">+ 添加题目</el-button></div></el-form-item></el-col>
          </template>
          <template v-else-if="contentType === 'course'">
            <el-col :span="8"><el-form-item label="时长（分钟）"><el-input-number v-model="form.minutes" :min="1" :max="999" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="讲师"><el-input v-model="form.teacher" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="学习人数"><el-input v-model="form.learners" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="课程介绍"><el-input v-model="form.intro" type="textarea" :rows="2" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="视频地址"><el-input v-model="form.video" placeholder="可选，支持 https:// 地址或后台上传地址" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="章节"><div class="repeat-list"><div v-for="(item, index) in form.chapters" :key="index" class="repeat-row"><el-input v-model="item.title" placeholder="章节标题" /><el-input v-model="item.duration" placeholder="05:00" /><el-button link type="danger" @click="removeChapter(index)" :disabled="form.chapters.length <= 1">删除</el-button></div><el-button link type="primary" @click="addChapter">+ 添加章节</el-button></div></el-form-item></el-col>
          </template>
          <template v-else-if="contentType === 'expert'">
            <el-col :span="12"><el-form-item label="专家姓名"><el-input v-model="form.name" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="资质说明"><el-input v-model="form.credentials" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="专家简介"><el-input v-model="form.profile" type="textarea" :rows="3" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="擅长方向"><el-input v-model="form.methodsText" placeholder="用逗号分隔，例如 情绪管理,压力调节" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="头像地址"><el-input v-model="form.photo" placeholder="builtin:avatar 或 /profile/upload/xxx.jpg" /></el-form-item></el-col>
          </template>
          <el-col v-if="contentType === 'activity'" :span="24"><el-form-item label="内容配置" prop="payloadJson"><el-input v-model="form.payloadJson" type="textarea" :rows="12" spellcheck="false" class="json-editor" /></el-form-item></el-col>
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
  if (props.contentType === 'assessment') return { ...common, count: 1, minutes: 3, art: 'flowers', hero: 'rest', description: '', questions: ['请填写题目'], options: ['从不', '偶尔', '经常', '几乎每天'], optionValues: [0, 1, 2, 3], scoring: { type: 'percent', maxScore: 100 }, crisisRules: { direction: 'none' } }
  if (props.contentType === 'course') return { ...common, minutes: 10, learners: '0', art: 'meadow', hero: 'video', teacher: '', intro: '', video: '', chapters: [{ title: '第一章', duration: '05:00' }] }
  if (props.contentType === 'expert') return { ...common, name: '', credentials: '', profile: '', methods: [], photo: 'builtin:avatar' }
  return { ...common, date: '', time: '', location: '', capacity: 20, enrolled: 0, status: '报名中', art: 'walking', hero: 'forest', intro: '', schedule: [] }
}

function emptyForm() {
  return { contentId: undefined, contentKey: '', contentType: props.contentType, title: '', category: '', summary: '', payloadJson: JSON.stringify(emptyPayload(), null, 2), status: '0', sortOrder: 0, minutes: 10, learners: '0', teacher: '', intro: '', video: '', chapters: [{ title: '第一章', duration: '05:00' }], questions: ['请填写题目'], options: ['从不', '偶尔', '经常', '几乎每天'], optionValues: [0, 1, 2, 3], sourceName: '', sourceUrl: '', license: '', version: '', scoringType: 'percent', scoreMax: 100, crisisDirection: 'none', crisisThreshold: 0, crisisReason: '', name: '', credentials: '', profile: '', methodsText: '', photo: 'builtin:avatar' }
}

function assignForm(value) {
  Object.assign(form, emptyForm(), value)
  let payload = {}
  try { payload = value?.payloadJson ? JSON.parse(value.payloadJson) : emptyPayload() } catch (_) { payload = emptyPayload() }
  form.payloadJson = JSON.stringify(payload, null, 2)
  if (props.contentType === 'assessment') {
    form.minutes = Number(payload.minutes || 3); form.questions = Array.isArray(payload.questions) ? payload.questions.map((item) => typeof item === 'string' ? item : item.text || item.question || '') : ['请填写题目']
    form.options = Array.isArray(payload.options) && payload.options.length ? payload.options : ['从不', '偶尔', '经常', '几乎每天']
    form.optionValues = Array.isArray(payload.optionValues) && payload.optionValues.length ? payload.optionValues : form.options.map((_, index) => index)
    form.sourceName = payload.sourceName || ''; form.sourceUrl = payload.sourceUrl || ''; form.license = payload.license || ''; form.version = payload.version || ''
    form.scoringType = payload.scoring?.type || 'percent'; form.scoreMax = Number(payload.scoring?.maxScore || (form.scoringType === 'sum' ? form.questions.length * Math.max(...form.optionValues) : 100))
    form.crisisDirection = payload.crisisRules?.direction || 'none'; form.crisisThreshold = Number(payload.crisisRules?.threshold || 0); form.crisisReason = payload.crisisRules?.reason || ''
  } else if (props.contentType === 'course') {
    form.minutes = Number(payload.minutes || 10); form.learners = payload.learners || '0'; form.teacher = payload.teacher || ''; form.intro = payload.intro || value.summary || ''; form.video = payload.video || ''; form.chapters = Array.isArray(payload.chapters) && payload.chapters.length ? payload.chapters : [{ title: '第一章', duration: '05:00' }]
  } else if (props.contentType === 'expert') {
    form.name = payload.name || value.title || ''; form.credentials = payload.credentials || ''; form.profile = payload.profile || value.summary || ''; form.methodsText = Array.isArray(payload.methods) ? payload.methods.join(',') : ''; form.photo = payload.photo || 'builtin:avatar'
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

function addQuestion() { form.questions.push('') }
function removeQuestion(index) { form.questions.splice(index, 1) }
function addOption() { form.options.push(''); form.optionValues.push(form.optionValues.length) }
function removeOption(index) { form.options.splice(index, 1); form.optionValues.splice(index, 1) }
function addChapter() { form.chapters.push({ title: '', duration: '05:00' }) }
function removeChapter(index) { form.chapters.splice(index, 1) }

function buildPayload() {
  if (props.contentType === 'assessment') return { ...emptyPayload(), id: form.contentKey, title: form.title, category: form.category, description: form.summary, count: form.questions.length, minutes: form.minutes, questions: form.questions, options: form.options, optionValues: form.optionValues, sourceName: form.sourceName, sourceUrl: form.sourceUrl, license: form.license, version: form.version, scoring: { type: form.scoringType, maxScore: form.scoreMax, displayMax: form.scoreMax, label: form.scoringType === 'sum' ? '原始总分' : '状态指数' }, crisisRules: { direction: form.crisisDirection, threshold: form.crisisThreshold, level: form.crisisDirection === 'none' ? 'normal' : 'high', reason: form.crisisReason } }
  if (props.contentType === 'course') return { ...emptyPayload(), id: form.contentKey, title: form.title, category: form.category, minutes: form.minutes, learners: form.learners, teacher: form.teacher, intro: form.intro || form.summary, video: form.video, chapters: form.chapters }
  if (props.contentType === 'expert') return { ...emptyPayload(), id: form.contentKey, title: form.title, category: form.category, name: form.name || form.title, credentials: form.credentials, profile: form.profile || form.summary, methods: form.methodsText.split(/[,，]/).map((item) => item.trim()).filter(Boolean), photo: form.photo, available: true }
  try { return JSON.parse(form.payloadJson) } catch (_) { return null }
}

async function submit() {
  await proxy.$refs.formRef.validate()
  const payload = buildPayload()
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    proxy.$modal.msgError('内容配置必须是 JSON 对象')
    return
  }
  payload.id = form.contentKey
  payload.title = form.title
  payload.category = form.category
  if ('description' in payload) payload.description = form.summary
  if ('intro' in payload && props.contentType !== 'course') payload.intro = form.summary
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
.repeat-list { width: 100%; display: flex; flex-direction: column; gap: 9px; }
.repeat-row { display: flex; gap: 9px; align-items: center; }
.repeat-row .el-input { flex: 1; }
.question-row .question-index { width: 24px; color: #7b8882; text-align: right; }
.risk-row { display: flex; gap: 9px; width: 100%; }
.risk-row .el-input { flex: 1; }
</style>
