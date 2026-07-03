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
        area.innerHTML = `<button type="button" class="btn btn-ghost" id="loginBtn">로그인 / 회원가입</button>`;
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
    $('#authSubmit').textContent = mode === 'signup' ? '회원가입' : '로그인';
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
