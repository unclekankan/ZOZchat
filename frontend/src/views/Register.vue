<template>
  <div class="register-container">
    <div class="register-form">
      <h2>注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="avatar-section">
          <div class="avatar-preview" @click="triggerFileInput">
            <img v-if="form.avatar" :src="form.avatar" alt="头像预览">
            <div v-else class="avatar-placeholder">
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
          <label for="username">用户名 *</label>
          <input type="text" id="username" v-model="form.username" required>
        </div>
        
        <div class="form-group">
          <label for="password">密码 *</label>
          <input type="password" id="password" v-model="form.password" required>
        </div>
        
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input type="text" id="nickname" v-model="form.nickname" placeholder="默认为用户名">
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input type="email" id="email" v-model="form.email" placeholder="可选">
        </div>
        
        <div class="form-group">
          <label for="bio">个人简介</label>
          <textarea id="bio" v-model="form.bio" placeholder="介绍一下自己..." rows="3"></textarea>
        </div>
        
        <button type="submit" class="register-btn">注册</button>
        <p class="login-link">已有账号？<router-link to="/">立即登录</router-link></p>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        password: '',
        nickname: '',
        email: '',
        bio: '',
        avatar: ''
      }
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    handleAvatarChange(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.form.avatar = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    
    async handleRegister() {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.form)
        })
        
        if (response.ok) {
          alert('注册成功，请登录')
          this.$router.push('/')
        } else {
          const errorData = await response.json()
          if (response.status === 400) {
            alert('注册失败：' + (errorData.message || '用户名已存在'))
          } else {
            alert('注册失败：' + (errorData.message || '服务器错误'))
          }
        }
      } catch (error) {
        console.error('注册错误:', error)
        alert('注册失败：无法连接到服务器，请确保后端服务已启动')
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.register-form h2 {
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-preview:hover {
  border-color: #4CAF50;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  text-align: center;
  color: #999;
  font-size: 14px;
}

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
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.register-btn {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 15px;
}

.register-btn:hover {
  background-color: #45a049;
}

.login-link {
  text-align: center;
  color: #666;
}

.login-link a {
  color: #4CAF50;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>