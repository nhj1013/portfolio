// ============================================
// ✅ 로그인 / 회원가입 모달 + 헤더 상태
// ============================================
import {api, auth} from './api.js';

const $ = (sel) => document.querySelector(sel);

export function initAuth(onChange) {
    renderAuthArea(onChange);

    $('#authModalClose').addEventListener('click', closeModal);
    $('#authModal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') closeModal();
    });

    // 로그인 <-> 회원가입 탭 전환
    document.querySelectorAll('.auth-tab').forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.mode));
    });

    $('#authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = $('#authForm').dataset.mode;
        const username = $('#authUsername').value.trim();
        const password = $('#authPassword').value;
        const nickname = $('#authNickname').value.trim();

        // 브라우저 기본 검증 말풍선(novalidate) 대신 하단 에러 텍스트로 안내
        const invalid =
            !username ? '아이디를 입력해주세요.'
            : !password ? '비밀번호를 입력해주세요.'
            : password.length < 8 ? '비밀번호는 8자 이상이어야 합니다.'
            : mode === 'signup' && !nickname ? '닉네임을 입력해주세요.'
            : mode === 'signup' && nickname.length < 2 ? '닉네임은 2자 이상이어야 합니다.'
            : '';
        if (invalid) {
            $('#authError').textContent = invalid;
            return;
        }

        try {
            const body = mode === 'signup' ? {username, password, nickname} : {username, password};
            const result = await api(`/api/v1/auth/${mode}`, {method: 'POST', body});
            auth.save(result);
            closeModal();
            renderAuthArea(onChange);
            onChange();
        } catch (err) {
            $('#authError').textContent = err.message;
        }
    });
}

function renderAuthArea(onChange) {
    const area = $('#authArea');
    if (auth.isLoggedIn) {
        area.innerHTML = `
            <span class="auth-nickname">${escapeHtml(auth.nickname)}님</span>
            <button type="button" class="btn btn-ghost" id="logoutBtn">로그아웃</button>`;
        $('#logoutBtn').addEventListener('click', () => {
            auth.clear();
            renderAuthArea(onChange);
            onChange();
        });
    } else {
        area.innerHTML = `<button type="button" class="btn btn-ghost" id="loginBtn">Login / Signup</button>`;
        $('#loginBtn').addEventListener('click', () => openModal('login'));
    }
}

function openModal(mode) {
    $('#authModal').classList.add('open');
    switchTab(mode);
}

function closeModal() {
    $('#authModal').classList.remove('open');
    $('#authForm').reset();
    $('#authError').textContent = '';
}

function switchTab(mode) {
    $('#authForm').dataset.mode = mode;
    document.querySelectorAll('.auth-tab').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    $('#nicknameRow').style.display = mode === 'signup' ? '' : 'none';
    $('#authNickname').required = mode === 'signup';
    $('#authSubmit').textContent = mode === 'signup' ? 'Signup' : 'Login';
    $('#authError').textContent = '';
}

export function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
