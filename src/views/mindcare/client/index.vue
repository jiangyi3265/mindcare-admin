<template>
  <div class="app-container client-page">
    <div class="page-heading"><div><h2>用户终端</h2><p>查看已与后端建立同步的匿名设备身份。系统不会在仓库中保存客户端明文凭证。</p></div><el-button icon="Refresh" :loading="loading" @click="load">刷新</el-button></div>
    <el-form ref="queryRef" :model="query" :inline="true" class="filter-bar">
      <el-form-item label="终端标识" prop="clientId"><el-input v-model="query.clientId" placeholder="输入终端标识" clearable @keyup.enter="search" /></el-form-item>
      <el-form-item label="昵称" prop="nickname"><el-input v-model="query.nickname" placeholder="输入昵称" clearable @keyup.enter="search" /></el-form-item>
      <el-form-item label="联系电话" prop="phone"><el-input v-model="query.phone" placeholder="输入电话" clearable @keyup.enter="search" /></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="search">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>
    <el-table :data="rows" v-loading="loading" empty-text="暂无同步终端">
      <el-table-column label="终端标识" prop="clientId" min-width="260" show-overflow-tooltip />
      <el-table-column label="昵称" prop="nickname" min-width="150"><template #default="scope">{{ scope.row.nickname || '访客' }}</template></el-table-column>
      <el-table-column label="联系电话" prop="phone" width="160"><template #default="scope">{{ scope.row.phone || '—' }}</template></el-table-column>
      <el-table-column label="首次连接" prop="createTime" width="170" />
      <el-table-column label="最近同步" prop="lastSeenTime" width="170" />
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="query.pageNum" v-model:limit="query.pageSize" @pagination="load" />
  </div>
</template>

<script setup name="MindcareClients">
import { listClients } from '@/api/mindcare'
const { proxy } = getCurrentInstance()
const loading = ref(false), rows = ref([]), total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, clientId: undefined, nickname: undefined, phone: undefined })
async function load() { loading.value = true; try { const response = await listClients(query); rows.value = response.rows || []; total.value = response.total || 0 } finally { loading.value = false } }
function search() { query.pageNum = 1; load() }
function resetQuery() { proxy.resetForm('queryRef'); search() }
load()
</script>

<style scoped lang="scss">
.client-page { color: #263c34; }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
h2 { margin: 0 0 7px; font-size: 22px; color: #263c34; } p { margin: 0; color: #718078; line-height: 1.6; }
.filter-bar { padding: 16px 18px 0; margin-bottom: 16px; background: #f7f9f6; border: 1px solid #e5eae6; border-radius: 8px; }
</style>
