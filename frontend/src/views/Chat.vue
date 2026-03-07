<template>
  <div class="chat-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-logo">
        <img src="/logo.jpg" alt="ZOZchat" class="sidebar-logo-img">
        <span class="sidebar-logo-text">ZOZchat</span>
      </div>
      <div class="user-info" @click="showUserProfile(currentUser)">
        <img 
          :src="currentUser?.avatar || '/default-avatar.png'" 
          class="user-avatar"
          alt="用户头像"
        >
        <div class="user-details">
          <div class="user-name">{{ currentUser?.nickname || currentUser?.username }}</div>
          <div class="user-friend-code" v-if="myFriendCode">
            好友码: <span class="code-value">{{ myFriendCode }}</span>
            <button class="copy-code-btn" @click.stop="copyFriendCode" title="复制好友码">📋</button>
          </div>
        </div>
      </div>

      <div class="friends-section" :style="{ flex: friendsSectionFlex }">
        <div class="section-header">
          <h3>好友列表</h3>
          <div class="header-buttons">
            <button class="add-friend-btn" @click="openAddFriendModal" title="添加好友">+</button>
            <button class="friend-requests-btn" @click="openFriendRequestsModal" title="好友请求">
              📬
              <span v-if="friendRequests.length > 0" class="badge">{{ friendRequests.length }}</span>
            </button>
          </div>
        </div>
        <div class="friends-list">
          <div 
            v-for="friend in friends" 
            :key="friend._id"
            class="friend-item"
            :class="{ active: currentFriend?._id === friend._id }"
            @click="selectFriend(friend)"
          >
            <img 
              :src="friend.avatar || '/default-avatar.png'" 
              class="friend-avatar"
              alt="好友头像"
            >
            <div class="friend-info">
              <div class="friend-name">{{ friend.nickname || friend.username }}</div>
              <div class="friend-status" :class="{ online: friend.isOnline, offline: !friend.isOnline }">
                {{ friend.isOnline ? '在线' : '离线' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        class="resize-handle" 
        @mousedown="startResize"
        @touchstart="startResize"
      >
        <div class="handle-line"></div>
      </div>

      <div class="groups-section" :style="{ flex: groupsSectionFlex }">
        <div class="section-header">
          <h3>聊天群组</h3>
          <div class="header-buttons">
            <button class="join-group-btn" @click="showJoinGroupModal" title="加入群组">#</button>
            <button class="create-group-btn" @click="showCreateGroupModal" title="创建群组">+</button>
          </div>
        </div>
        <div class="groups-list">
          <div 
            v-for="group in groups" 
            :key="group._id"
            class="group-item"
            :class="{ active: currentGroup?._id === group._id && !currentFriend }"
            @click="selectGroup(group)"
          >
            <img 
              :src="group.avatar || '/default-group.png'" 
              class="group-avatar"
              alt="群组头像"
            >
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-preview">{{ group.lastMessage || '暂无消息' }}</div>
            </div>
          </div>
        </div>
      </div>

      <button class="logout-btn" @click="handleLogout">退出</button>
    </div>

    <div class="main-chat" v-if="currentGroup || currentFriend">
      <div class="chat-header">
        <div class="chat-header-info">
          <img 
            v-if="currentGroup"
            :src="currentGroup.avatar || '/default-group.png'" 
            class="chat-group-avatar"
            alt="群组头像"
          >
          <img 
            v-else-if="currentFriend"
            :src="currentFriend.avatar || '/default-avatar.png'" 
            class="chat-group-avatar"
            alt="好友头像"
          >
          <div class="chat-group-details">
            <h3>{{ currentGroup?.name || currentFriend?.nickname || currentFriend?.username }}</h3>
            <span v-if="currentGroup" class="member-count">{{ currentGroup.members?.length || 0 }} 人</span>
            <span v-else class="member-count">私聊</span>
          </div>
        </div>
        <button v-if="currentGroup" class="group-info-btn" @click="showGroupInfo">群组信息</button>
        <button v-else class="group-info-btn" @click="showFriendInfo">好友信息</button>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message._id" 
          class="message"
          :class="{ 'own-message': getMessageSenderId(message) === currentUser?._id }"
        >
          <div class="message-avatar" @click="showUserProfile(getMessageUser(message))">
            <img 
              :src="getMessageUser(message)?.avatar || '/default-avatar.png'" 
              alt="用户头像"
            >
          </div>
          <div class="message-content">
            <div class="message-sender">{{ getMessageUser(message)?.nickname || getMessageUser(message)?.username }}</div>
            <div class="message-bubble" :class="{ 'recalled': message.isRecalled }">
              <template v-if="message.isRecalled">
                消息已撤回
              </template>
              <template v-else-if="message.messageType === 'image'">
                <img 
                  :src="getImageUrl(message.imageUrl)" 
                  class="message-image" 
                  @click="previewImage(getImageUrl(message.imageUrl))"
                  alt="图片消息"
                >
              </template>
              <template v-else>
                {{ message.content }}
              </template>
            </div>
            <div class="message-meta">
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
              <button 
                v-if="!message.isRecalled && getMessageSenderId(message) === currentUser?._id"
                class="recall-btn"
                @click="recallMessage(message._id)"
              >
                撤回
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="input-toolbar">
          <button class="toolbar-btn emoji-btn" @click="toggleEmojiPicker" title="表情">
            😊
          </button>
          <button class="toolbar-btn image-btn" @click="triggerImageUpload" title="发送图片">
            🖼️
          </button>
          <input 
            type="file" 
            ref="imageInput" 
            accept="image/*" 
            @change="handleImageUpload"
            style="display: none"
          >
        </div>
        
        <div class="emoji-picker" v-if="showEmojiPicker">
          <div class="emoji-grid">
            <span 
              v-for="emoji in emojis" 
              :key="emoji" 
              class="emoji-item"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </span>
          </div>
        </div>
        
        <div class="input-container">
          <input 
            type="text" 
            v-model="inputMessage" 
            @keyup.enter="sendMessage"
            placeholder="输入消息..."
            class="message-input"
          >
          <button @click="sendMessage" class="send-btn">发送</button>
        </div>
      </div>
    </div>

    <!-- 未选择群组时的提示 -->
    <div class="no-group-selected" v-else>
      <div class="welcome-message">
        <h2>欢迎使用在线聊天</h2>
        <p>请从左侧选择一个群组开始聊天</p>
        <p>或者点击 # 按钮通过邀请码加入群组</p>
      </div>
    </div>

    <!-- 用户资料弹窗 -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal-content user-modal" @click.stop>
        <div class="modal-header">
          <h3>用户资料</h3>
          <button class="close-btn" @click="closeUserModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedUser">
          <div class="profile-avatar">
            <img :src="selectedUser.avatar || '/default-avatar.png'" alt="用户头像">
          </div>
          <div class="profile-info">
            <div class="profile-item">
              <label>用户名:</label>
              <span>{{ selectedUser.username }}</span>
            </div>
            <div class="profile-item">
              <label>昵称:</label>
              <span>{{ selectedUser.nickname || '未设置' }}</span>
            </div>
            <div class="profile-item">
              <label>邮箱:</label>
              <span>{{ selectedUser.email || '未设置' }}</span>
            </div>
            <div class="profile-item">
              <label>个人简介:</label>
              <p class="bio-text">{{ selectedUser.bio || '这个人很懒，什么都没写...' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加入群组弹窗 -->
    <div v-if="showJoinModal" class="modal-overlay" @click="closeJoinModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>加入群组</h3>
          <button class="close-btn" @click="closeJoinModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>邀请码</label>
            <input 
              type="text" 
              v-model="joinCode" 
              placeholder="输入6位邀请码"
              maxlength="6"
              class="invite-code-input"
            >
          </div>
          <button class="create-btn" @click="searchGroupByCode">查找群组</button>
          
          <!-- 查找到的群组信息 -->
          <div v-if="foundGroup" class="found-group">
            <div class="found-group-info">
              <img :src="foundGroup.avatar || '/default-group.png'" alt="群组头像">
              <div class="found-group-details">
                <h4>{{ foundGroup.name }}</h4>
                <p>{{ foundGroup.description || '暂无描述' }}</p>
                <span class="member-count">{{ foundGroup.memberCount }} 人</span>
              </div>
            </div>
            <button 
              v-if="!foundGroup.isMember" 
              class="join-btn" 
              @click="joinGroupByCode"
            >
              加入群组
            </button>
            <button 
              v-else 
              class="already-member-btn" 
              disabled
            >
              已是成员
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建群组弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建新群组</h3>
          <button class="close-btn" @click="closeCreateModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>群组名称 *</label>
            <input type="text" v-model="newGroup.name" placeholder="输入群组名称">
          </div>
          <div class="form-group">
            <label>群组描述</label>
            <textarea v-model="newGroup.description" placeholder="输入群组描述" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>群组头像</label>
            <div class="avatar-upload" @click="triggerGroupFileInput">
              <img v-if="newGroup.avatar" :src="newGroup.avatar" alt="群组头像">
              <div v-else class="upload-placeholder">点击上传头像</div>
            </div>
            <input 
              type="file" 
              ref="groupFileInput" 
              accept="image/*" 
              @change="handleGroupAvatarChange"
              style="display: none"
            >
          </div>
          <button class="create-btn" @click="createGroup">创建群组</button>
        </div>
      </div>
    </div>

    <!-- 群组信息弹窗 -->
    <div v-if="showGroupInfoModal" class="modal-overlay" @click="closeGroupInfoModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>群组信息</h3>
          <button class="close-btn" @click="closeGroupInfoModal">&times;</button>
        </div>
        <div class="modal-body" v-if="currentGroup">
          <div class="group-info-header">
            <img :src="currentGroup.avatar || '/default-group.png'" class="group-info-avatar" alt="群组头像">
            <h4>{{ currentGroup.name }}</h4>
            <p>{{ currentGroup.description || '暂无描述' }}</p>
          </div>
          
          <!-- 邀请码区域 -->
          <div class="invite-code-section">
            <div class="invite-code-display">
              <label>邀请码:</label>
              <div class="code-box">
                <span class="code">{{ currentGroup.inviteCode }}</span>
                <button class="copy-btn" @click="copyInviteCode">复制</button>
              </div>
            </div>
            <p class="invite-tip">分享此邀请码给好友，让他们加入群组</p>
            <button 
              v-if="isCurrentUserAdmin" 
              class="regenerate-btn"
              @click="regenerateInviteCode"
            >
              重新生成邀请码
            </button>
          </div>
          
          <div class="group-members">
            <h4>群组成员 ({{ currentGroup.members?.length || 0 }})</h4>
            <div class="members-list">
              <div 
                v-for="member in currentGroup.members" 
                :key="member.user._id"
                class="member-item"
                @click="showUserProfile(member.user)"
              >
                <img :src="member.user.avatar || '/default-avatar.png'" alt="成员头像">
                <span class="member-name">{{ member.user.nickname || member.user.username }}</span>
                <span v-if="member.role === 'admin'" class="admin-badge">管理员</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showAddFriendModalFlag" class="modal-overlay" @click="closeAddFriendModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加好友</h3>
          <button class="close-btn" @click="closeAddFriendModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>输入好友码</label>
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchFriendCode" 
                @keyup.enter="searchUsers"
                placeholder="输入6位好友码"
                maxlength="6"
                class="friend-code-input"
              >
              <button class="search-btn" @click="searchUsers">搜索</button>
            </div>
          </div>
          
          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="user in searchResults" 
              :key="user._id"
              class="search-result-item"
            >
              <img :src="user.avatar || '/default-avatar.png'" alt="用户头像">
              <div class="user-info">
                <div class="username">{{ user.nickname || user.username }}</div>
                <div class="user-bio">{{ user.bio || '暂无简介' }}</div>
              </div>
              <button class="add-btn" @click="sendFriendRequest(user._id)">添加</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showFriendRequestsModalFlag" class="modal-overlay" @click="closeFriendRequestsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>好友请求</h3>
          <button class="close-btn" @click="closeFriendRequestsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="friendRequests.length === 0" class="empty-message">
            暂无好友请求
          </div>
          <div v-else class="friend-requests-list">
            <div 
              v-for="request in friendRequests" 
              :key="request._id"
              class="friend-request-item"
            >
              <img :src="request.requester.avatar || '/default-avatar.png'" alt="用户头像">
              <div class="request-info">
                <div class="username">{{ request.requester.nickname || request.requester.username }}</div>
                <div class="request-time">{{ formatTime(request.createdAt) }}</div>
              </div>
              <div class="request-actions">
                <button class="accept-btn" @click="acceptFriendRequest(request._id)">接受</button>
                <button class="reject-btn" @click="rejectFriendRequest(request._id)">拒绝</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
      <img :src="previewImageUrl" class="preview-image" @click.stop>
      <button class="close-preview-btn" @click="closeImagePreview">&times;</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentUser: null,
      groups: [],
      currentGroup: null,
      currentFriend: null,
      messages: [],
      inputMessage: '',
      showUserModal: false,
      selectedUser: null,
      showCreateModal: false,
      newGroup: {
        name: '',
        description: '',
        avatar: ''
      },
      showGroupInfoModal: false,
      showJoinModal: false,
      joinCode: '',
      foundGroup: null,
      pollingInterval: null,
      showEmojiPicker: false,
      emojis: [
        '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
        '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
        '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
        '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
        '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
        '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕',
        '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
        '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
        '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '🎉', '❤️', '💔',
        '✨', '🔥', '💯', '🎁', '🌟', '⭐', '🌈', '☀️', '🌙', '⚡'
      ],
      showImagePreview: false,
      previewImageUrl: '',
      friends: [],
      friendRequests: [],
      showAddFriendModalFlag: false,
      showFriendRequestsModalFlag: false,
      searchFriendCode: '',
      searchResults: [],
      myFriendCode: '',
      friendsSectionFlex: '1',
      groupsSectionFlex: '1',
      isResizing: false,
      startY: 0,
      startFriendsFlex: 0,
      startGroupsFlex: 0,
      heartbeatInterval: null
    }
  },
  computed: {
    isCurrentUserAdmin() {
      if (!this.currentGroup || !this.currentUser) return false
      const member = this.currentGroup.members?.find(m => 
        m.user._id === this.currentUser._id
      )
      return member?.role === 'admin'
    }
  },
  mounted() {
    this.checkAuth()
    this.loadUserInfo()
    this.loadGroups()
    this.loadFriends()
    this.loadFriendRequests()
    this.loadMyFriendCode()
    this.startHeartbeat()
    
    document.addEventListener('mousemove', this.handleResize)
    document.addEventListener('mouseup', this.stopResize)
    document.addEventListener('touchmove', this.handleResize)
    document.addEventListener('touchend', this.stopResize)
  },
  beforeUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    document.removeEventListener('mousemove', this.handleResize)
    document.removeEventListener('mouseup', this.stopResize)
    document.removeEventListener('touchmove', this.handleResize)
    document.removeEventListener('touchend', this.stopResize)
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.$router.push('/')
      }
    },
    
    startHeartbeat() {
      this.sendHeartbeat()
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat()
        this.loadFriends()
      }, 30000)
    },
    
    async sendHeartbeat() {
      try {
        const token = localStorage.getItem('token')
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (error) {
        console.error('发送心跳失败:', error)
      }
    },
    
    async loadUserInfo() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.currentUser = await response.json()
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    },
    
    async loadGroups() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/groups', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.groups = await response.json()
          if (this.groups.length > 0 && !this.currentGroup) {
            this.selectGroup(this.groups[0])
          }
        }
      } catch (error) {
        console.error('加载群组失败:', error)
      }
    },
    
    async selectGroup(group) {
      this.currentFriend = null
      this.currentGroup = group
      await this.loadMessages()
      this.startPolling()
    },
    
    async selectFriend(friend) {
      this.currentGroup = null
      this.currentFriend = friend
      await this.loadMessages()
      this.startPolling()
    },
    
    async loadMessages() {
      if (!this.currentGroup && !this.currentFriend) return
      
      try {
        const token = localStorage.getItem('token')
        let url = ''
        
        if (this.currentGroup) {
          url = `/api/messages/${this.currentGroup._id}`
        } else if (this.currentFriend) {
          url = `/api/private-messages/${this.currentFriend._id}`
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.messages = await response.json()
          this.scrollToBottom()
        }
      } catch (error) {
        console.error('加载消息失败:', error)
      }
    },
    
    startPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }
      
      this.pollingInterval = setInterval(() => {
        this.loadMessages()
      }, 3000)
    },
    
    async sendMessage() {
      if (!this.inputMessage.trim() || (!this.currentGroup && !this.currentFriend)) return
      
      try {
        const token = localStorage.getItem('token')
        let url = ''
        
        if (this.currentGroup) {
          url = `/api/messages/${this.currentGroup._id}`
        } else if (this.currentFriend) {
          url = `/api/private-messages/${this.currentFriend._id}`
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content: this.inputMessage })
        })
        
        if (response.ok) {
          this.inputMessage = ''
          await this.loadMessages()
        }
      } catch (error) {
        console.error('发送消息失败:', error)
      }
    },
    
    async recallMessage(messageId) {
      try {
        const token = localStorage.getItem('token')
        let url = ''
        
        if (this.currentGroup) {
          url = `/api/messages/${messageId}/recall`
        } else if (this.currentFriend) {
          url = `/api/private-messages/${messageId}/recall`
        }
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          await this.loadMessages()
        }
      } catch (error) {
        console.error('撤回消息失败:', error)
      }
    },
    
    getMessageSenderId(message) {
      if (this.currentGroup) {
        return message.userId?._id
      } else if (this.currentFriend) {
        return message.senderId?._id
      }
      return null
    },
    
    getMessageUser(message) {
      if (this.currentGroup) {
        return message.userId
      } else if (this.currentFriend) {
        return message.senderId
      }
      return null
    },
    
    async loadFriends() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/friends/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.friends = await response.json()
        }
      } catch (error) {
        console.error('加载好友列表失败:', error)
      }
    },
    
    async loadFriendRequests() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/friends/requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.friendRequests = await response.json()
        }
      } catch (error) {
        console.error('加载好友请求失败:', error)
      }
    },
    
    openAddFriendModal() {
      this.showAddFriendModalFlag = true
      this.searchFriendCode = ''
      this.searchResults = []
    },
    
    closeAddFriendModal() {
      this.showAddFriendModalFlag = false
      this.searchFriendCode = ''
      this.searchResults = []
    },
    
    openFriendRequestsModal() {
      this.showFriendRequestsModalFlag = true
    },
    
    closeFriendRequestsModal() {
      this.showFriendRequestsModalFlag = false
    },
    
    async loadMyFriendCode() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/friends/my-code', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.myFriendCode = data.friendCode
        }
      } catch (error) {
        console.error('获取好友码失败:', error)
      }
    },
    
    copyFriendCode() {
      navigator.clipboard.writeText(this.myFriendCode).then(() => {
        alert('好友码已复制: ' + this.myFriendCode)
      }).catch(() => {
        alert('复制失败，请手动复制: ' + this.myFriendCode)
      })
    },
    
    async searchUsers() {
      if (!this.searchFriendCode.trim() || this.searchFriendCode.length !== 6) {
        alert('请输入6位好友码')
        return
      }
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/friends/search?friendCode=${encodeURIComponent(this.searchFriendCode.toUpperCase())}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.searchResults = await response.json()
          if (this.searchResults.length === 0) {
            alert('未找到该用户')
          }
        } else {
          const error = await response.json()
          alert(error.message || '搜索失败')
          this.searchResults = []
        }
      } catch (error) {
        console.error('搜索用户失败:', error)
        alert('搜索失败，请稍后重试')
      }
    },
    
    async sendFriendRequest(userId) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/friends/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId })
        })
        
        if (response.ok) {
          alert('好友请求已发送')
          this.closeAddFriendModal()
        } else {
          const error = await response.json()
          alert(error.message || '发送好友请求失败')
        }
      } catch (error) {
        console.error('发送好友请求失败:', error)
        alert('发送好友请求失败')
      }
    },
    
    async acceptFriendRequest(friendshipId) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/friends/accept/${friendshipId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          await this.loadFriends()
          await this.loadFriendRequests()
        }
      } catch (error) {
        console.error('接受好友请求失败:', error)
      }
    },
    
    async rejectFriendRequest(friendshipId) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/friends/reject/${friendshipId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          await this.loadFriendRequests()
        }
      } catch (error) {
        console.error('拒绝好友请求失败:', error)
      }
    },
    
    showFriendInfo() {
      if (this.currentFriend) {
        this.showUserProfile(this.currentFriend)
      }
    },
    
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker
    },
    
    getImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return `http://localhost:3000${url}`
    },
    
    insertEmoji(emoji) {
      this.inputMessage += emoji
      this.showEmojiPicker = false
    },
    
    triggerImageUpload() {
      this.$refs.imageInput.click()
    },
    
    async handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }
      
      const formData = new FormData()
      formData.append('image', file)
      
      try {
        const token = localStorage.getItem('token')
        let url = ''
        
        if (this.currentGroup) {
          url = `/api/messages/${this.currentGroup._id}/image`
        } else if (this.currentFriend) {
          url = `/api/private-messages/${this.currentFriend._id}/image`
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        if (response.ok) {
          await this.loadMessages()
        } else {
          const error = await response.json()
          alert(error.message || '发送图片失败')
        }
      } catch (error) {
        console.error('发送图片失败:', error)
        alert('发送图片失败，请稍后重试')
      }
      
      event.target.value = ''
    },
    
    previewImage(url) {
      this.previewImageUrl = url
      this.showImagePreview = true
    },
    
    closeImagePreview() {
      this.showImagePreview = false
      this.previewImageUrl = ''
    },
    
    showUserProfile(user) {
      if (!user) return
      this.selectedUser = user
      this.showUserModal = true
    },
    
    closeUserModal() {
      this.showUserModal = false
      this.selectedUser = null
    },
    
    showJoinGroupModal() {
      this.showJoinModal = true
      this.joinCode = ''
      this.foundGroup = null
    },
    
    closeJoinModal() {
      this.showJoinModal = false
      this.joinCode = ''
      this.foundGroup = null
    },
    
    async searchGroupByCode() {
      if (!this.joinCode.trim()) {
        alert('请输入邀请码')
        return
      }
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/groups/invite/${this.joinCode.trim().toUpperCase()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.foundGroup = {
            ...data.group,
            isMember: data.isMember
          }
        } else {
          const error = await response.json()
          alert(error.message || '邀请码无效')
          this.foundGroup = null
        }
      } catch (error) {
        console.error('查找群组失败:', error)
        alert('查找群组失败，请稍后重试')
      }
    },
    
    async joinGroupByCode() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/groups/join-by-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ inviteCode: this.joinCode.trim().toUpperCase() })
        })
        
        if (response.ok) {
          const group = await response.json()
          this.groups.push(group)
          this.selectGroup(group)
          this.closeJoinModal()
          alert('成功加入群组！')
        } else {
          const error = await response.json()
          alert(error.message || '加入群组失败')
        }
      } catch (error) {
        console.error('加入群组失败:', error)
        alert('加入群组失败，请稍后重试')
      }
    },
    
    showCreateGroupModal() {
      this.showCreateModal = true
    },
    
    closeCreateModal() {
      this.showCreateModal = false
      this.newGroup = { name: '', description: '', avatar: '' }
    },
    
    triggerGroupFileInput() {
      this.$refs.groupFileInput.click()
    },
    
    handleGroupAvatarChange(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.newGroup.avatar = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    
    async createGroup() {
      if (!this.newGroup.name.trim()) {
        alert('请输入群组名称')
        return
      }
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.newGroup)
        })
        
        if (response.ok) {
          const group = await response.json()
          this.groups.push(group)
          this.selectGroup(group)
          this.closeCreateModal()
          alert(`群组创建成功！\n邀请码: ${group.inviteCode}\n请保存此邀请码以便邀请好友加入`)
        }
      } catch (error) {
        console.error('创建群组失败:', error)
      }
    },
    
    showGroupInfo() {
      this.showGroupInfoModal = true
    },
    
    closeGroupInfoModal() {
      this.showGroupInfoModal = false
    },
    
    copyInviteCode() {
      if (this.currentGroup?.inviteCode) {
        navigator.clipboard.writeText(this.currentGroup.inviteCode).then(() => {
          alert('邀请码已复制到剪贴板！')
        }).catch(() => {
          // 降级方案
          const textArea = document.createElement('textarea')
          textArea.value = this.currentGroup.inviteCode
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          alert('邀请码已复制到剪贴板！')
        })
      }
    },
    
    async regenerateInviteCode() {
      if (!confirm('确定要重新生成邀请码吗？旧的邀请码将失效。')) {
        return
      }
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/groups/${this.currentGroup._id}/regenerate-code`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.currentGroup.inviteCode = data.inviteCode
          alert(`新的邀请码已生成: ${data.inviteCode}`)
        } else {
          const error = await response.json()
          alert(error.message || '重新生成邀请码失败')
        }
      } catch (error) {
        console.error('重新生成邀请码失败:', error)
        alert('重新生成邀请码失败，请稍后重试')
      }
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }
      this.$router.push('/')
    },
    
    startResize(event) {
      this.isResizing = true
      this.startY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY
      this.startFriendsFlex = parseFloat(this.friendsSectionFlex) || 1
      this.startGroupsFlex = parseFloat(this.groupsSectionFlex) || 1
      event.preventDefault()
    },
    
    handleResize(event) {
      if (!this.isResizing) return
      
      const currentY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY
      const deltaY = currentY - this.startY
      
      const totalFlex = this.startFriendsFlex + this.startGroupsFlex
      const deltaFlex = deltaY / 200
      
      let newFriendsFlex = this.startFriendsFlex + deltaFlex
      let newGroupsFlex = this.startGroupsFlex - deltaFlex
      
      if (newFriendsFlex < 0.3) {
        newFriendsFlex = 0.3
        newGroupsFlex = totalFlex - 0.3
      }
      if (newGroupsFlex < 0.5) {
        newGroupsFlex = 0.5
        newFriendsFlex = totalFlex - 0.5
      }
      
      this.friendsSectionFlex = newFriendsFlex.toString()
      this.groupsSectionFlex = newGroupsFlex.toString()
    },
    
    stopResize() {
      this.isResizing = false
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    },
    
    scrollToBottom() {
      setTimeout(() => {
        const container = this.$refs.messagesContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 100)
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

/* 左侧边栏样式 */
.sidebar {
  width: 300px;
  background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 10px;
}

.sidebar-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  background: white;
  border-radius: 8px;
  padding: 4px;
}

.sidebar-logo-text {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.user-friend-code {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 5px;
}

.code-value {
  font-family: monospace;
  font-weight: bold;
  letter-spacing: 2px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.copy-code-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.copy-code-btn:hover {
  opacity: 1;
}

.groups-section {
  overflow-y: auto;
  min-height: 120px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.join-group-btn {
  background-color: #3498db;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-group-btn:hover {
  background-color: #2980b9;
}

.create-group-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-group-btn:hover {
  background-color: #45a049;
}

.groups-list {
  padding: 10px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 5px;
}

.group-item:hover,
.group-item.active {
  background-color: rgba(255, 255, 255, 0.15);
}

.group-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: bold;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-preview {
  font-size: 12px;
  color: #bdc3c7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  border-radius: 20px;
  margin: 10px auto;
  display: block;
  transition: all 0.3s;
}

.logout-btn:hover {
  background-color: #c0392b;
  transform: scale(1.05);
}

.resize-handle {
  height: 8px;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
}

.resize-handle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.handle-line {
  width: 40px;
  height: 3px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

/* 主聊天区域样式 */
.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.chat-header-info {
  display: flex;
  align-items: center;
}

.chat-group-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.chat-group-details h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.member-count {
  font-size: 12px;
  color: #666;
}

.group-info-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.group-info-btn:hover {
  background-color: #45a049;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message.own-message .message-content {
  align-items: flex-end;
}

.message-sender {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.message-bubble {
  background-color: #f1f1f1;
  padding: 10px 15px;
  border-radius: 18px;
  word-wrap: break-word;
  max-width: 100%;
}

.message.own-message .message-bubble {
  background-color: #DCF8C6;
}

.message-bubble.recalled {
  background-color: #f0f0f0;
  color: #999;
  font-style: italic;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.recall-btn {
  background-color: transparent;
  border: none;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
}

.recall-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.chat-input-area {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.input-container {
  display: flex;
  gap: 10px;
}

.message-input {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
}

.message-input:focus {
  border-color: #4CAF50;
}

.send-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
}

.send-btn:hover {
  background-color: #45a049;
}

.no-group-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.welcome-message {
  text-align: center;
  color: #666;
}

.welcome-message h2 {
  margin-bottom: 10px;
  color: #333;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

/* 加入群组弹窗样式 */
.invite-code-input {
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
  font-weight: bold;
  text-transform: uppercase;
}

.found-group {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.found-group-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.found-group-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}

.found-group-details h4 {
  margin: 0 0 5px 0;
}

.found-group-details p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.join-btn {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.join-btn:hover {
  background-color: #45a049;
}

.already-member-btn {
  width: 100%;
  padding: 12px;
  background-color: #ccc;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: not-allowed;
  font-size: 16px;
}

/* 用户资料弹窗 */
.profile-avatar {
  text-align: center;
  margin-bottom: 20px;
}

.profile-avatar img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-item {
  margin-bottom: 15px;
}

.profile-item label {
  font-weight: bold;
  color: #666;
  display: block;
  margin-bottom: 5px;
}

.bio-text {
  color: #333;
  line-height: 1.5;
  margin: 0;
}

/* 创建群组弹窗 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.avatar-upload {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}

.avatar-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.create-btn {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.create-btn:hover {
  background-color: #45a049;
}

/* 群组信息弹窗 */
.group-info-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.group-info-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 10px;
  object-fit: cover;
}

.group-info-header h4 {
  margin: 0 0 10px 0;
}

.group-info-header p {
  color: #666;
  margin: 0;
}

/* 邀请码区域 */
.invite-code-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.invite-code-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.invite-code-display label {
  font-weight: bold;
  color: #555;
}

.code-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.code {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
  letter-spacing: 4px;
  background-color: white;
  padding: 8px 16px;
  border-radius: 4px;
  border: 2px solid #4CAF50;
}

.copy-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.copy-btn:hover {
  background-color: #45a049;
}

.invite-tip {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}

.regenerate-btn {
  width: 100%;
  padding: 10px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.regenerate-btn:hover {
  background-color: #f57c00;
}

.group-members h4 {
  margin-bottom: 15px;
}

.members-list {
  max-height: 200px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.member-item:hover {
  background-color: #f5f5f5;
}

.member-item img {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.member-name {
  flex: 1;
}

.admin-badge {
  background-color: #e74c3c;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.input-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.toolbar-btn {
  background-color: #f0f0f0;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.toolbar-btn:hover {
  background-color: #e0e0e0;
  transform: scale(1.1);
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-width: 320px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.2s;
}

.emoji-item:hover {
  background-color: #f0f0f0;
}

.message-image {
  max-width: 300px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}

.message-image:hover {
  transform: scale(1.05);
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}

.close-preview-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.close-preview-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.chat-input-area {
  position: relative;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.message-bubble {
  background-color: #f1f1f1;
  padding: 10px 15px;
  border-radius: 18px;
  word-wrap: break-word;
  max-width: 100%;
  position: relative;
}

.message.own-message .message-bubble {
  background-color: #DCF8C6;
}

.friends-section {
  overflow-y: auto;
  min-height: 80px;
}

.friends-list {
  padding: 10px;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 5px;
}

.friend-item:hover,
.friend-item.active {
  background-color: rgba(255, 255, 255, 0.15);
}

.friend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name {
  font-weight: bold;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-status {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.friend-status.online {
  color: #2ecc71;
}

.friend-status.online::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #2ecc71;
  border-radius: 50%;
  display: inline-block;
}

.friend-status.offline {
  color: #95a5a6;
}

.friend-status.offline::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #95a5a6;
  border-radius: 50%;
  display: inline-block;
}

.add-friend-btn,
.friend-requests-btn {
  background-color: #3498db;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.add-friend-btn:hover,
.friend-requests-btn:hover {
  background-color: #2980b9;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.search-box {
  display: flex;
  gap: 10px;
}

.search-box input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-btn {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn:hover {
  background-color: #2980b9;
}

.search-results {
  margin-top: 20px;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background-color: #f8f9fa;
  margin-bottom: 10px;
}

.search-result-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.search-result-item .user-info {
  flex: 1;
}

.search-result-item .username {
  font-weight: bold;
  margin-bottom: 3px;
}

.search-result-item .user-bio {
  font-size: 12px;
  color: #666;
}

.add-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn:hover {
  background-color: #45a049;
}

.empty-message {
  text-align: center;
  color: #999;
  padding: 20px;
}

.friend-requests-list {
  margin-top: 10px;
}

.friend-request-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background-color: #f8f9fa;
  margin-bottom: 10px;
}

.friend-request-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.request-info {
  flex: 1;
}

.request-info .username {
  font-weight: bold;
  margin-bottom: 3px;
}

.request-time {
  font-size: 12px;
  color: #999;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.accept-btn {
  padding: 6px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.accept-btn:hover {
  background-color: #45a049;
}

.reject-btn {
  padding: 6px 12px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.reject-btn:hover {
  background-color: #c0392b;
}

.friend-code-input {
  text-transform: uppercase;
  letter-spacing: 4px;
  font-weight: bold;
  text-align: center;
  font-size: 18px;
}
</style>