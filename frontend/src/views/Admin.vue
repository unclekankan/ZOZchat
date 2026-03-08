<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>后台管理</h1>
      <button class="back-btn" @click="goBack">返回</button>
    </div>
    
    <div class="admin-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>
    
    <div class="admin-content">
      <!-- 用户管理 -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <h2>用户列表</h2>
        <div class="user-list">
          <div v-for="user in users" :key="user._id" class="user-item">
            <div class="user-info">
              <img :src="user.avatar || '/default-avatar.png'" alt="Avatar" class="user-avatar">
              <div class="user-details">
                <h3>{{ user.nickname || user.username }}</h3>
                <p>用户名: {{ user.username }}</p>
                <p v-if="user.name">姓名: {{ user.name }}</p>
                <p>好友码: {{ user.friendCode }}</p>
                <p>注册时间: {{ formatDate(user.createdAt) }}</p>
                <p v-if="user.isAdmin" class="admin-badge">管理员</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="users.length === 0" class="empty-state">
          暂无用户数据
        </div>
      </div>
      
      <!-- 群聊管理 -->
      <div v-if="activeTab === 'groups'" class="tab-content">
        <h2>群聊列表</h2>
        <div class="group-list">
          <div v-for="group in groups" :key="group._id" class="group-item">
            <div class="group-info">
              <h3>{{ group.name }}</h3>
              <p>邀请码: {{ group.inviteCode }}</p>
              <p>{{ group.description }}</p>
              <p>成员数: {{ group.members.length }}</p>
              <p>创建者: {{ group.creator?.nickname || group.creator?.username }}</p>
              <p>创建时间: {{ formatDate(group.createdAt) }}</p>
            </div>
          </div>
        </div>
        <div v-if="groups.length === 0" class="empty-state">
          暂无群聊数据
        </div>
      </div>
      
      <!-- 群聊消息 -->
      <div v-if="activeTab === 'messages'" class="tab-content">
        <h2>群聊消息</h2>
        <div class="message-list">
          <div v-for="message in messages" :key="message._id" class="message-item">
            <div class="message-info">
              <img :src="message.userId?.avatar || '/default-avatar.png'" alt="Avatar" class="sender-avatar">
              <div class="message-details">
                <h4>{{ message.userId?.nickname || message.userId?.username }}</h4>
                <p class="message-text">{{ message.content }}</p>
                <p class="message-meta">
                  群聊: {{ message.groupId?.name }} | {{ formatDate(message.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="messages.length === 0" class="empty-state">
          暂无消息数据
        </div>
      </div>
      
      <!-- 私聊消息 -->
      <div v-if="activeTab === 'private-messages'" class="tab-content">
        <h2>私聊消息</h2>
        <div class="message-list">
          <div v-for="message in privateMessages" :key="message._id" class="message-item">
            <div class="message-info">
              <img :src="message.senderId?.avatar || '/default-avatar.png'" alt="Avatar" class="sender-avatar">
              <div class="message-details">
                <h4>{{ message.senderId?.nickname || message.senderId?.username }} → {{ message.recipientId?.nickname || message.recipientId?.username }}</h4>
                <p class="message-text">{{ message.content }}</p>
                <p class="message-meta">
                  {{ formatDate(message.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="privateMessages.length === 0" class="empty-state">
          暂无私聊消息数据
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'users',
      tabs: [
        { id: 'users', name: '用户管理' },
        { id: 'groups', name: '群聊管理' },
        { id: 'messages', name: '群聊消息' },
        { id: 'private-messages', name: '私聊消息' }
      ],
      users: [],
      groups: [],
      messages: [],
      privateMessages: []
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    goBack() {
      this.$router.push('/chat')
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString()
    },
    async loadData() {
      try {
        // 加载用户数据
        const usersResponse = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (usersResponse.ok) {
          this.users = await usersResponse.json()
        }
        
        // 加载群聊数据
        const groupsResponse = await fetch('/api/admin/groups', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (groupsResponse.ok) {
          this.groups = await groupsResponse.json()
        }
        
        // 加载群聊消息
        const messagesResponse = await fetch('/api/admin/messages', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (messagesResponse.ok) {
          this.messages = await messagesResponse.json()
        }
        
        // 加载私聊消息
        const privateMessagesResponse = await fetch('/api/admin/private-messages', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (privateMessagesResponse.ok) {
          this.privateMessages = await privateMessagesResponse.json()
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        this.$message.error('加载数据失败')
      }
    }
  }
}
</script>

<style scoped>
.admin-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.admin-header h1 {
  font-size: 28px;
  font-weight: bold;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.admin-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.tab-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.4);
  font-weight: bold;
}

.admin-content {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  height: calc(100vh - 200px);
  overflow-y: auto;
}

.tab-content h2 {
  margin-bottom: 20px;
  font-size: 20px;
}

.user-list, .group-list, .message-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-item, .group-item, .message-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  transition: background 0.3s;
}

.user-item:hover, .group-item:hover, .message-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.user-info {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.user-avatar, .sender-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.2);
}

.user-details h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.user-details p {
  margin: 3px 0;
  font-size: 14px;
  opacity: 0.8;
}

.admin-badge {
  display: inline-block;
  background: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 5px;
}

.group-info h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.group-info p {
  margin: 3px 0;
  font-size: 14px;
  opacity: 0.8;
}

.message-info {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.message-details h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
}

.message-text {
  margin: 5px 0;
  font-size: 14px;
  line-height: 1.4;
}

.message-meta {
  margin: 5px 0 0 0;
  font-size: 12px;
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 40px;
  opacity: 0.7;
  font-size: 16px;
}

/* 滚动条样式 */
.admin-content::-webkit-scrollbar {
  width: 8px;
}

.admin-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.admin-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.admin-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-container {
    padding: 10px;
  }
  
  .admin-header h1 {
    font-size: 24px;
  }
  
  .tab-btn {
    padding: 10px 16px;
    font-size: 12px;
  }
  
  .admin-content {
    padding: 15px;
  }
}
</style>