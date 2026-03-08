<template>
  <div class="auth-container">
    <div class="logo-section">
      <img src="/logo.jpg" alt="ZOZchat" class="logo-img">
      <h1 class="logo-text">ZOZchat</h1>
      <p class="logo-tagline">简洁 · 高效 · 连接</p>
    </div>
    <div class="auth-card" :class="{ 'slide-left': !isLogin, 'slide-right': isLogin }">
      <div class="auth-header">
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>
        <div class="auth-tabs">
          <button 
            :class="{ active: isLogin }" 
            @click="switchToLogin"
          >
            登录
          </button>
          <button 
            :class="{ active: !isLogin }" 
            @click="switchToRegister"
          >
            注册
          </button>
        </div>
      </div>

      <transition name="slide-fade" mode="out-in">
        <div v-if="isLogin" key="login" class="auth-form">
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="login-username">用户名</label>
              <input 
                type="text" 
                id="login-username" 
                v-model="loginForm.username" 
                required
                placeholder="请输入用户名"
              >
            </div>
            <div class="form-group">
              <label for="login-password">密码</label>
              <input 
                type="password" 
                id="login-password" 
                v-model="loginForm.password" 
                required
                placeholder="请输入密码"
              >
            </div>
            <button type="submit" class="auth-btn">登录</button>
          </form>
        </div>

        <div v-else key="register" class="auth-form">
          <form @submit.prevent="handleRegister">
            <div class="avatar-section">
              <div class="avatar-preview" @click="triggerFileInput">
                <img v-if="registerForm.avatar" :src="registerForm.avatar" alt="头像预览">
                <div v-else class="avatar-placeholder">
                  <span class="avatar-icon">📷</span>
                  <span>点击上传头像</span>
                </div>
              </div>
              <input 
                type="file" 
                ref="fileInput" 
                accept="image/*" 
                @change="handleAvatarChange"
                style="display: none"
              >
            </div>
            
            <div class="form-group">
              <label for="register-username">用户名 *</label>
              <input 
                type="text" 
                id="register-username" 
                v-model="registerForm.username" 
                required
                placeholder="请输入用户名"
              >
            </div>
            
            <div class="form-group">
              <label for="register-password">密码 *</label>
              <input 
                type="password" 
                id="register-password" 
                v-model="registerForm.password" 
                required
                placeholder="请输入密码"
              >
            </div>
            
            <div class="form-group">
              <label for="register-nickname">昵称</label>
              <input 
                type="text" 
                id="register-nickname" 
                v-model="registerForm.nickname" 
                placeholder="默认为用户名"
              >
            </div>
            
            <div class="form-group">
              <label for="register-email">邮箱</label>
              <input 
                type="email" 
                id="register-email" 
                v-model="registerForm.email" 
                placeholder="可选"
              >
            </div>
            
            <div class="form-group">
              <label for="register-bio">个人简介</label>
              <textarea 
                id="register-bio" 
                v-model="registerForm.bio" 
                placeholder="介绍一下自己..." 
                rows="3"
              ></textarea>
            </div>
            
            <button type="submit" class="auth-btn">注册</button>
          </form>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Auth',
  data() {
    return {
      isLogin: true,
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        password: '',
        nickname: '',
        email: '',
        bio: '',
        avatar: ''
      }
    }
  },
  mounted() {
    const path = this.$route.path
    if (path === '/register') {
      this.isLogin = false
    }
  },
  methods: {
    switchToLogin() {
      if (!this.isLogin) {
        this.isLogin = true
        this.$router.push('/')
      }
    },
    
    switchToRegister() {
      if (this.isLogin) {
        this.isLogin = false
        this.$router.push('/register')
      }
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    handleAvatarChange(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.registerForm.avatar = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    
    async handleLogin() {
      if (!this.loginForm.username.trim()) {
        alert('请输入用户名')
        return
      }
      if (!this.loginForm.password.trim()) {
        alert('请输入密码')
        return
      }
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.loginForm)
        })
        
        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('token', data.token)
          this.$router.push('/chat')
        } else {
          let errorMessage = '登录失败，请检查用户名和密码'
          try {
            const error = await response.json()
            errorMessage = error.message || errorMessage
          } catch (e) {
            // 使用默认错误消息
          }
          alert(errorMessage)
        }
      } catch (error) {
        console.error('登录错误:', error)
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          alert('无法连接到服务器\n\n请确保后端服务已启动：\n1. 打开终端\n2. 进入 backend 目录\n3. 运行 npm run dev')
        } else {
          alert('登录失败：' + error.message)
        }
      }
    },
    
    async handleRegister() {
      if (!this.registerForm.username.trim()) {
        alert('请输入用户名')
        return
      }
      if (!this.registerForm.password.trim()) {
        alert('请输入密码')
        return
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.registerForm)
        })
        
        if (response.ok) {
          alert('注册成功，请登录')
          this.switchToLogin()
          this.loginForm.username = this.registerForm.username
        } else {
          let errorMessage = '注册失败'
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            if (response.status === 400) {
              errorMessage = '用户名已存在'
            } else if (response.status === 500) {
              errorMessage = '服务器错误，请稍后重试'
            }
          }
          alert(errorMessage)
        }
      } catch (error) {
        console.error('注册错误:', error)
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          alert('无法连接到服务器\n\n请确保后端服务已启动：\n1. 打开终端\n2. 进入 backend 目录\n3. 运行 npm run dev')
        } else {
          alert('注册失败：' + error.message)
        }
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  padding: 20px;
  gap: 60px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  animation: fadeInUp 0.8s ease;
}

.logo-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 20px;
  background: white;
  border-radius: 20px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.logo-text {
  font-size: 48px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-tagline {
  font-size: 16px;
  color: #888;
  margin-top: 10px;
  letter-spacing: 4px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 420px;
  max-height: 90vh;
  overflow: hidden;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.auth-card:hover {
  transform: translateY(-5px);
}

.auth-header {
  padding: 30px 40px 20px;
  text-align: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  flex-shrink: 0;
}

.auth-header h2 {
  margin: 0 0 20px 0;
  font-size: 28px;
  font-weight: 600;
}

.auth-tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.auth-tabs button {
  flex: 1;
  padding: 10px 20px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.auth-tabs button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.auth-tabs button.active {
  background: white;
  color: #1a1a1a;
}

.auth-form {
  padding: 30px 40px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #f5f5f5;
}

.avatar-preview:hover {
  border-color: #1a1a1a;
  transform: scale(1.05);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.avatar-icon {
  font-size: 24px;
}

.avatar-placeholder span:last-child {
  font-size: 12px;
  color: #999;
}

.auth-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(26, 26, 26, 0.4);
}

.auth-btn:active {
  transform: translateY(0);
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.auth-card.slide-left {
  animation: slideInRight 0.3s ease;
}

.auth-card.slide-right {
  animation: slideInLeft 0.3s ease;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
    padding: 10px;
    gap: 15px;
    justify-content: flex-start;
    padding-top: 20px;
  }
  
  .logo-section {
    margin-bottom: 5px;
  }
  
  .logo-img {
    width: 60px;
    height: 60px;
    padding: 8px;
    margin-bottom: 10px;
  }
  
  .logo-text {
    font-size: 24px;
    letter-spacing: 1px;
  }
  
  .logo-tagline {
    font-size: 12px;
    letter-spacing: 2px;
    margin-top: 5px;
  }
  
  .auth-card {
    width: 100%;
    max-width: 100%;
    border-radius: 12px;
    max-height: calc(100vh - 180px);
    display: flex;
    flex-direction: column;
  }
  
  .auth-header {
    padding: 15px 15px 10px;
    flex-shrink: 0;
  }
  
  .auth-header h2 {
    font-size: 20px;
    margin-bottom: 12px;
  }
  
  .auth-tabs {
    gap: 8px;
  }
  
  .auth-tabs button {
    padding: 8px 14px;
    font-size: 13px;
  }
  
  .auth-form {
    padding: 15px;
    max-height: none;
    overflow-y: auto;
    flex: 1;
  }
  
  .form-group {
    margin-bottom: 12px;
  }
  
  .form-group label {
    font-size: 12px;
    margin-bottom: 5px;
  }
  
  .form-group input,
  .form-group textarea {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .form-group textarea {
    min-height: 60px;
    resize: vertical;
  }
  
  .avatar-section {
    margin-bottom: 15px;
  }
  
  .avatar-preview {
    width: 70px;
    height: 70px;
  }
  
  .avatar-icon {
    font-size: 18px;
  }
  
  .avatar-placeholder span:last-child {
    font-size: 10px;
  }
  
  .auth-btn {
    padding: 10px;
    font-size: 14px;
    margin-top: 5px;
  }
}

/* 平板设备适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .auth-container {
    gap: 40px;
  }
  
  .logo-img {
    width: 100px;
    height: 100px;
  }
  
  .logo-text {
    font-size: 40px;
  }
  
  .auth-card {
    width: 380px;
    display: flex;
    flex-direction: column;
  }
  
  .auth-header {
    flex-shrink: 0;
  }
  
  .auth-form {
    flex: 1;
  }
}
</style>
