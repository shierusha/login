// ====== Supabase 設定 ======
const client = window.supabase.createClient(
  'https://wfhwhvodgikpducrhgda.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaHdodm9kZ2lrcGR1Y3JoZ2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTAwNjEsImV4cCI6MjA2MzU4NjA2MX0.P6P-x4SxjiR4VdWH6VFgY_ktgMac_OzuI4Bl7HWskz8'
);

// ===== 錯誤訊息轉換 =====
function transErrorMsg(msg) {
  if (!msg) return '';
  if (msg.includes('Invalid login credentials')) return '帳號或密碼錯誤';
  if (msg.includes('Email not confirmed')) return '信箱尚未驗證，請至信箱點擊驗證連結！';
  if (msg.includes('User already registered')) return '此信箱已經註冊過了';
  if (msg.includes('User not found')) return '查無此帳號，請確認信箱是否輸入正確';
  if (msg.includes('Password should be at least')) return '密碼長度不足（至少 6 位）';
  if (msg.includes('Invalid email or password')) return '帳號或密碼錯誤';
  if (msg.includes('network error')) return '網路連線失敗，請稍後再試';
  if (msg.includes('Email rate limit')) return '請勿頻繁操作，請稍後再試';
  return msg;
}

// ==== 密碼顯示/隱藏（貓咪眼睛）====
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '(=ω=)';
  } else {
    input.type = 'password';
    btn.textContent = '(ΦωΦ)';
  }
}

// ===== 表單切換 =====
function showSignUp() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = '';
  document.getElementById('forgot-form').style.display = 'none';
  document.getElementById('login-msg').textContent = '';
  document.getElementById('signup-msg').textContent = '';
  document.getElementById('forgot-msg').textContent = '';
}
function showLogin(msg='') {
  document.getElementById('login-form').style.display = '';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'none';
  document.getElementById('signup-msg').textContent = '';
  document.getElementById('forgot-msg').textContent = '';
  if (msg) {
    document.getElementById('login-msg').textContent = msg;
    document.getElementById('login-msg').className = 'msg success';
  } else {
    document.getElementById('login-msg').textContent = '';
    document.getElementById('login-msg').className = 'msg';
  }
}
function showForgot() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('forgot-form').style.display = '';
  document.getElementById('login-msg').textContent = '';
  document.getElementById('signup-msg').textContent = '';
  document.getElementById('forgot-msg').textContent = '';
}
function setLoading(isLoading) {
  document.getElementById('login-btn').classList.toggle('loading', isLoading);
  document.getElementById('signup-btn').classList.toggle('loading', isLoading);
  document.getElementById('forgot-btn').classList.toggle('loading', isLoading);
}

// ============ 忘記密碼 ============
async function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const msgDiv = document.getElementById('forgot-msg');
  msgDiv.textContent = '';
  if (!email) {
    msgDiv.textContent = '請輸入電子信箱';
    return;
  }
  document.getElementById('forgot-btn').classList.add('loading');
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://shierusha.github.io/login/reset.html'
  });
  document.getElementById('forgot-btn').classList.remove('loading');
  if (error) {
    msgDiv.textContent = '寄送失敗: ' + transErrorMsg(error.message);
  } else {
    msgDiv.textContent = '已寄送密碼重設信到你的信箱，請查收！';
    msgDiv.className = 'msg success';
  }
}

// ============ 註冊 ============
async function signUp() {
  setLoading(true);
  document.getElementById('signup-msg').textContent = '';
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const username = document.getElementById('signup-username').value.trim();
  if (!email || !password || !username) {
    document.getElementById('signup-msg').textContent = '請填寫所有欄位';
    setLoading(false);
    return;
  }
  let data, error;
  try {
    ({ data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://shierusha.github.io/login/reset.html'
      }
    }));
  } catch (e) {
    document.getElementById('signup-msg').textContent = '無法連線到伺服器';
    setLoading(false);
    return;
  }
  if (error) {
    document.getElementById('signup-msg').textContent = '註冊失敗: ' + transErrorMsg(error.message);
    setLoading(false);
    return;
  }
  const user = data.user;
  if (!user) {
    document.getElementById('signup-msg').textContent = '請檢查信箱驗證設定，註冊未成功。';
    setLoading(false);
    return;
  }
  let insertError;
  try {
    ({ error: insertError } = await client.from('players').insert({
      player_id: user.id,
      email: email,
      username: username,
      role: 'player'
    }));
  } catch (e) {
    document.getElementById('signup-msg').textContent = '無法連線到伺服器';
    setLoading(false);
    return;
  }
  if (insertError) {
    document.getElementById('signup-msg').textContent = '玩家資料儲存失敗: ' + transErrorMsg(insertError.message);
    setLoading(false);
    return;
  }
  setLoading(false);
  showLogin('註冊成功，請驗證信箱！');
}

// ============ 登入 ============
async function signIn() {
  setLoading(true);
  document.getElementById('login-msg').textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) {
    document.getElementById('login-msg').textContent = '請輸入帳號與密碼';
    setLoading(false);
    return;
  }
  let data, error;
  try {
    ({ data, error } = await client.auth.signInWithPassword({ email, password }));
  } catch (e) {
    document.getElementById('login-msg').textContent = '無法連線到伺服器';
    setLoading(false);
    return;
  }
  if (error) {
    document.getElementById('login-msg').textContent = '登入失敗: ' + transErrorMsg(error.message);
    setLoading(false);
    return;
  }
  const user = data.user;
  if (!user) {
    document.getElementById('login-msg').textContent = '帳號異常，請確認信箱驗證';
    setLoading(false);
    return;
  }
  localStorage.setItem('player_id', user.id);

  // 查 players 資料表取得身份
  let player, playerError;
  try {
    ({ data: player, error: playerError } = await client
      .from('players')
      .select('*')
      .eq('player_id', user.id)
      .single());
  } catch (e) {
    document.getElementById('login-msg').textContent = '無法查詢玩家資料';
    setLoading(false);
    return;
  }
  if (playerError) {
    document.getElementById('login-msg').textContent = '查無玩家資料，請重新註冊';
    setLoading(false);
    return;
  }
  localStorage.setItem('player_username', player.username);

  // 依照身份自動導頁
  if (player.role === 'admin') {
    setTimeout(() => {
      window.location.href = 'admin.html'; // 這裡改成你管理頁網址
    }, 600);
  } else {
    setTimeout(() => {
      window.location.href = 'https://shierusha.github.io/create-student/charlist.html'; // 這裡是玩家首頁
    }, 600);
  }
}


// 初始化顯示登入
document.addEventListener('DOMContentLoaded', function() {
  showLogin();
});
