<template>
  <div class="app-container client-page">
    <div class="page-heading">
      <div><h2>用户账户与终端</h2><p>注册账号与已同步设备分别展示。手机号尚未通过短信验证，请仅作为登录标识使用。</p></div>
      <el-button icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>
    <el-tabs v-model="activeTab" @tab-change="load">
      <el-tab-pane label="注册账号" name="accounts">
        <el-form ref="accountQueryRef" :model="accountQuery" :inline="true" class="filter-bar">
          <el-form-item label="手机号" prop="phone"><el-input v-model="accountQuery.phone" placeholder="输入登录手机号" clearable @keyup.enter="searchAccounts" /></el-form-item>
          <el-form-item label="昵称" prop="nickname"><el-input v-model="accountQuery.nickname" placeholder="输入昵称" clearable @keyup.enter="searchAccounts" /></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="searchAccounts">查询</el-button><el-button icon="Refresh" @click="resetAccounts">重置</el-button></el-form-item>
        </el-form>
        <el-table :data="accounts" v-loading="loading" empty-text="暂无注册账号">
          <el-table-column label="账号ID" prop="accountId" width="110" />
          <el-table-column label="登录手机号" prop="phone" min-width="170" />
          <el-table-column label="昵称" prop="nickname" min-width="150" />
          <el-table-column label="注册时间" width="180"><template #default="scope">{{ shortTime(scope.row.createTime) }}</template></el-table-column>
        </el-table>
        <pagination v-show="accountTotal > 0" :total="accountTotal" v-model:page="accountQuery.pageNum" v-model:limit="accountQuery.pageSize" @pagination="loadAccounts" />
      </el-tab-pane>
      <el-tab-pane label="同步终端" name="clients">
        <el-form ref="clientQueryRef" :model="clientQuery" :inline="true" class="filter-bar">
          <el-form-item label="终端标识" prop="clientId"><el-input v-model="clientQuery.clientId" placeholder="输入终端标识" clearable @keyup.enter="searchClients" /></el-form-item>
          <el-form-item label="昵称" prop="nickname"><el-input v-model="clientQuery.nickname" placeholder="输入昵称" clearable @keyup.enter="searchClients" /></el-form-item>
          <el-form-item label="手机号" prop="phone"><el-input v-model="clientQuery.phone" placeholder="输入账号或联系手机号" clearable @keyup.enter="searchClients" /></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="searchClients">查询</el-button><el-button icon="Refresh" @click="resetClients">重置</el-button></el-form-item>
        </el-form>
        <el-table :data="clients" v-loading="loading" empty-text="暂无同步终端">
          <el-table-column label="终端标识" prop="clientId" min-width="230" show-overflow-tooltip />
          <el-table-column label="所属账号" min-width="180"><template #default="scope">{{ scope.row.accountId ? `${scope.row.accountId} · ${scope.row.accountPhone}` : '未登录访客' }}</template></el-table-column>
          <el-table-column label="昵称" prop="nickname" min-width="130"><template #default="scope">{{ scope.row.nickname || '访客' }}</template></el-table-column>
          <el-table-column label="最近同步" width="180"><template #default="scope">{{ shortTime(scope.row.lastSeenTime) }}</template></el-table-column>
        </el-table>
        <pagination v-show="clientTotal > 0" :total="clientTotal" v-model:page="clientQuery.pageNum" v-model:limit="clientQuery.pageSize" @pagination="loadClients" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="MindcareClients">
import { listAccounts, listClients } from '@/api/mindcare'
const { proxy } = getCurrentInstance()
const activeTab = ref('accounts')
const loading = ref(false)
const accounts = ref([]), accountTotal = ref(0)
const clients = ref([]), clientTotal = ref(0)
const accountQuery = reactive({ pageNum: 1, pageSize: 10, phone: undefined, nickname: undefined })
const clientQuery = reactive({ pageNum: 1, pageSize: 10, clientId: undefined, nickname: undefined, phone: undefined })
function shortTime(value) { return value ? String(value).replace('T', ' ').slice(0, 19) : '—' }
async function loadAccounts() {
  loading.value = true
  try { const response = await listAccounts(accountQuery); accounts.value = response.rows || []; accountTotal.value = response.total || 0 }
  finally { loading.value = false }
}
async function loadClients() {
  loading.value = true
  try { const response = await listClients(clientQuery); clients.value = response.rows || []; clientTotal.value = response.total || 0 }
  finally { loading.value = false }
}
function load() { return activeTab.value === 'accounts' ? loadAccounts() : loadClients() }
function searchAccounts() { accountQuery.pageNum = 1; loadAccounts() }
function searchClients() { clientQuery.pageNum = 1; loadClients() }
function resetAccounts() { proxy.resetForm('accountQueryRef'); searchAccounts() }
function resetClients() { proxy.resetForm('clientQueryRef'); searchClients() }
loadAccounts()
</script>

<style scoped lang="scss">
.client-page { color: #263c34; }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
h2 { margin: 0 0 7px; font-size: 22px; color: #263c34; }
p { margin: 0; color: #718078; line-height: 1.6; }
.filter-bar { padding: 16px 18px 0; margin-bottom: 16px; background: #f7f9f6; border: 1px solid #e5eae6; border-radius: 8px; }
</style>
