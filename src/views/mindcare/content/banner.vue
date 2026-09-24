<template>
  <div class="app-container banner-page">
    <div class="page-heading">
      <div>
        <h2>首页轮播图</h2>
        <p>管理用户端“心理测评”首页的主视觉；按排序值从小到大展示，已发布的图片自动轮播。</p>
      </div>
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['mindcare:content:add']">新增轮播图</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" row-key="contentId" empty-text="暂无轮播图，点击右上角新增">
      <el-table-column label="预览" width="138">
        <template #default="{ row }">
          <el-image v-if="imageOf(row)" class="banner-thumb" :src="imageUrl(imageOf(row))" fit="cover" :alt="row.title" />
          <div v-else class="builtin-thumb">暂无图片</div>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="220" />
      <el-table-column label="排序" prop="sortOrder" width="90" align="center" />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'info'" effect="plain">{{ row.status === '0' ? '已发布' : '已下架' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="更新时间" width="175">
        <template #default="{ row }">{{ row.updateTime || row.createTime || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)" v-hasPermi="['mindcare:content:edit']">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)" v-hasPermi="['mindcare:content:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="query.pageNum" v-model:limit="query.pageSize" @pagination="load" />

    <el-dialog v-model="dialogOpen" :title="form.contentId ? '编辑轮播图' : '新增轮播图'" width="620px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" maxlength="100" show-word-limit placeholder="用于图片说明和无障碍阅读" /></el-form-item>
        <el-form-item label="内容标识" prop="contentKey"><el-input v-model="form.contentKey" :disabled="Boolean(form.contentId)" placeholder="如 home-spring" /></el-form-item>
        <el-form-item label="轮播图片" prop="image">
          <div class="image-editor">
            <el-select v-model="form.image" placeholder="选择内置图片，或上传新图片" clearable>
              <el-option label="内置·当前首页主视觉" value="builtin:hero" />
              <el-option label="内置·慢下来，听见自己" value="builtin:rest" />
              <el-option v-if="form.image.startsWith('/profile/')" label="已上传图片" :value="form.image" />
            </el-select>
            <el-upload :action="uploadUrl" :headers="uploadHeaders" :show-file-list="false" :before-upload="beforeUpload" :on-success="uploadSuccess" :on-error="uploadError" accept="image/jpeg,image/png">
              <el-button icon="Upload">上传图片</el-button>
            </el-upload>
            <el-image v-if="form.image" class="image-preview" :src="imageUrl(form.image)" fit="cover" :alt="form.title" />
            <span class="image-tip">建议横图，宽高比约 2.1:1；仅支持 JPG/PNG，最多 5 MB。</span>
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder"><el-input-number v-model="form.sortOrder" :min="0" :max="999" /></el-form-item>
        <el-form-item label="状态" prop="status"><el-switch v-model="form.status" active-value="0" inactive-value="1" active-text="发布" inactive-text="下架" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MindcareBanners">
import { getToken } from '@/utils/auth'
import { addContent, deleteContent, getContent, listContent, updateContent } from '@/api/mindcare'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const rows = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 20, contentType: 'banner' })
const form = reactive(emptyForm())
const uploadUrl = `${import.meta.env.VITE_APP_BASE_API}/common/upload`
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${getToken()}` }))
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  contentKey: [
    { required: true, message: '请输入内容标识', trigger: 'blur' },
    { pattern: /^[a-z0-9][a-z0-9-]*$/, message: '仅支持小写字母、数字和连字符', trigger: 'blur' }
  ],
  image: [{ required: true, message: '请选择或上传轮播图片', trigger: 'change' }]
}

function emptyForm() {
  return { contentId: undefined, contentKey: '', title: '', image: '', sortOrder: 0, status: '0' }
}

function imageOf(row) {
  try { return JSON.parse(row.payloadJson || '{}').image || '' } catch (_) { return '' }
}

function imageUrl(path) {
  if (path === 'builtin:hero') return '/banners/hero-preview.webp'
  if (path === 'builtin:rest') return '/banners/rest-preview.webp'
  return `${import.meta.env.VITE_APP_BASE_API}${path}`
}

async function load() {
  loading.value = true
  try {
    const response = await listContent(query)
    rows.value = response.rows || []
    total.value = response.total || 0
  } finally { loading.value = false }
}

function handleAdd() { Object.assign(form, emptyForm()); dialogOpen.value = true }

async function handleEdit(row) {
  const response = await getContent(row.contentId)
  const content = response.data
  Object.assign(form, emptyForm(), content, { image: imageOf(content) })
  dialogOpen.value = true
}

function beforeUpload(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    proxy.$modal.msgError('请上传不超过 5 MB 的 JPG 或 PNG 图片')
    return false
  }
  return true
}

function uploadSuccess(response) {
  if (response.code !== 200 || !/^\/profile\/upload\/[A-Za-z0-9/_-]+\.(png|jpe?g)$/.test(response.fileName || '')) {
    proxy.$modal.msgError(response.msg || '图片上传失败')
    return
  }
  form.image = response.fileName
  proxy.$modal.msgSuccess('图片已上传，请保存轮播图')
}

function uploadError() { proxy.$modal.msgError('图片上传失败，请重试') }

async function submit() {
  await proxy.$refs.formRef.validate()
  const data = {
    contentId: form.contentId,
    contentKey: form.contentKey,
    contentType: 'banner',
    title: form.title,
    category: '首页轮播图',
    summary: '',
    payloadJson: JSON.stringify({ id: form.contentKey, title: form.title, image: form.image }),
    status: form.status,
    sortOrder: form.sortOrder
  }
  saving.value = true
  try {
    if (form.contentId) await updateContent(data)
    else await addContent(data)
    proxy.$modal.msgSuccess('保存成功，用户端下次同步后生效')
    dialogOpen.value = false
    await load()
  } finally { saving.value = false }
}

function handleDelete(row) {
  proxy.$modal.confirm(`确认删除“${row.title}”吗？删除后用户端将不再展示。`).then(async () => {
    await deleteContent(row.contentId)
    proxy.$modal.msgSuccess('删除成功')
    await load()
  }).catch(() => {})
}

load()
</script>

<style scoped>
.banner-page { color: #263c34; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-heading h2 { margin: 0 0 7px; font-size: 22px; font-weight: 650; }
.page-heading p { margin: 0; color: #6f7e77; line-height: 1.6; }
.banner-thumb, .builtin-thumb { display: block; width: 112px; height: 54px; border-radius: 6px; }
.builtin-thumb { background: #eef3ec; color: #526d60; display: grid; place-items: center; font-size: 12px; }
.image-editor { width: 100%; display: flex; align-items: flex-start; flex-direction: column; gap: 10px; }
.image-editor .el-select { width: 100%; }
.image-preview { width: 100%; max-width: 360px; aspect-ratio: 2.1; border-radius: 6px; }
.image-tip { color: #7b8882; font-size: 12px; line-height: 1.5; }
</style>
