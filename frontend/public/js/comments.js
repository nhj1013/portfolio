// ============================================
// ✅ 댓글 / 대댓글 UI
// - 루트 댓글 페이징, 대댓글 작성, 수정/삭제
// - 회원(JWT) 댓글과 게스트(닉네임+비밀번호) 댓글 모두 지원
// ============================================
import {api, auth} from './api.js';
import {escapeHtml} from './auth.js';

const $ = (sel) => document.querySelector(sel);
const PAGE_SIZE = 10;

let currentPage = 0;

export function initComments() {
    $('#commentForm').addEventListener('submit', onSubmitRoot);
    $('#commentList').addEventListener('click', onListClick);
    $('#pagination').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-page]');
        if (btn) loadComments(Number(btn.dataset.page));
    });
    initCommentModal();
    refreshGuestFields();
    loadComments(0);
}

// ---------- 확인/게스트 비밀번호 모달 (auth 모달과 같은 .modal/.modal-box 사용) ----------
let modalResolve = null;
let modalOnConfirm = null;

function initCommentModal() {
    $('#commentModalClose').addEventListener('click', () => closeCommentModal(null));
    $('#commentModalCancel').addEventListener('click', () => closeCommentModal(null));
    $('#commentModal').addEventListener('click', (e) => {
        if (e.target.id === 'commentModal') closeCommentModal(null);
    });
    $('#commentModalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const needPw = $('#commentModalPwRow').style.display !== 'none';
        const pw = $('#commentModalPw').value;
        if (needPw && !pw) {
            $('#commentModalError').textContent = '비밀번호를 입력해주세요.';
            return;
        }
        const value = needPw ? pw : true;

        // onConfirm(API 호출)이 있으면 모달을 띄운 채 실행하고,
        // 실패 시 모달 안에 에러를 표시한다 (성공해야만 닫힘)
        if (modalOnConfirm) {
            try {
                await modalOnConfirm(value);
            } catch (err) {
                $('#commentModalError').textContent = err.message;
                return;
            }
        }
        closeCommentModal(value);
    });
}

// 확인(onConfirm 성공) 시 비밀번호(또는 true), 취소/닫기 시 null 로 resolve 되는 Promise 반환
function openCommentModal({title, desc = '', password = false, onConfirm = null}) {
    $('#commentModalTitle').textContent = title;
    $('#commentModalDesc').textContent = desc;
    $('#commentModalDesc').style.display = desc ? '' : 'none';
    $('#commentModalPwRow').style.display = password ? '' : 'none';
    $('#commentModalPw').value = '';
    $('#commentModalError').textContent = '';
    $('#commentModal').classList.add('open');
    if (password) $('#commentModalPw').focus();
    modalOnConfirm = onConfirm;
    return new Promise((resolve) => {
        modalResolve = resolve;
    });
}

function closeCommentModal(result) {
    $('#commentModal').classList.remove('open');
    modalResolve?.(result);
    modalResolve = null;
    modalOnConfirm = null;
}

// ---------- 공통 유효성 검사 (브라우저 기본 검증 대신 하단 에러 텍스트) ----------
function validateComment({needGuest, nickname, password, content, contentLabel}) {
    if (needGuest) {
        if (!nickname) return '닉네임을 입력해주세요.';
        if (nickname.length < 2) return '닉네임은 2자 이상이어야 합니다.';
        if (!password) return '비밀번호를 입력해주세요.';
        if (password.length < 4) return '비밀번호는 4자 이상이어야 합니다.';
    }
    if (!content) return `${contentLabel} 내용을 입력해주세요.`;
    return '';
}

// 로그인 상태 변경 시 호출
export function onAuthChanged() {
    refreshGuestFields();
    loadComments(currentPage);
}

function refreshGuestFields() {
    $('#guestFields').style.display = auth.isLoggedIn ? 'none' : '';
}

async function loadComments(page) {
    currentPage = page;
    try {
        const data = await api(`/api/v1/comments?page=${page}&size=${PAGE_SIZE}`);
        renderList(data);
        renderPagination(data);
        $('#commentCount').textContent = data.totalCount;
    } catch (err) {
        $('#commentList').innerHTML = `<li class="comment-empty">댓글을 불러오지 못했습니다. (${escapeHtml(err.message)})</li>`;
    }
}

function renderList(data) {
    const list = $('#commentList');
    if (!data.comments.length) {
        list.innerHTML = '<li class="comment-empty">첫 댓글을 남겨보세요 🙌</li>';
        return;
    }
    list.innerHTML = data.comments.map((c) => `
        <li class="comment" data-id="${c.id}">
            ${commentBody(c)}
            <ul class="replies">
                ${c.replies.map((r) => `<li class="comment reply" data-id="${r.id}">${commentBody(r)}</li>`).join('')}
            </ul>
            <div class="reply-form-slot"></div>
        </li>`).join('');
}

function commentBody(c) {
    const canEdit = !c.deleted && (c.mine || c.guest);
    const date = formatDate(c.createdAt);
    const edited = !c.deleted && c.updatedAt && c.updatedAt.slice(0, 19) !== c.createdAt.slice(0, 19) ? ' (수정됨)' : '';
    return `
        <div class="comment-head">
            <span class="comment-nick">${escapeHtml(c.nickname ?? '알 수 없음')}</span>
            ${c.guest ? '<span class="badge">게스트</span>' : '<span class="badge badge-member">회원</span>'}
            <span class="comment-date">${date}${edited}</span>
        </div>
        <p class="comment-content ${c.deleted ? 'deleted' : ''}">${escapeHtml(c.content)}</p>
        <div class="comment-actions">
            ${c.parentId == null && !c.deleted ? '<button type="button" class="link-btn" data-action="reply">답글 </button>' : ''}
            ${canEdit ? `
                <button type="button" class="link-btn" data-action="edit">수정</button>
                <button type="button" class="link-btn danger" data-action="delete">삭제</button>` : ''}
        </div>`;
}

async function onSubmitRoot(e) {
    e.preventDefault();
    const errorEl = $('#commentError');
    const content = $('#commentContent').value.trim();

    const invalid = validateComment({
        needGuest: !auth.isLoggedIn,
        nickname: $('#guestNickname').value.trim(),
        password: $('#guestPassword').value,
        content,
        contentLabel: '댓글',
    });
    if (invalid) {
        errorEl.textContent = invalid;
        return;
    }
    errorEl.textContent = '';

    try {
        await createComment({content, parentId: null});
        $('#commentForm').reset();
        loadComments(0);
    } catch (err) {
        errorEl.textContent = err.message;
    }
}

async function createComment({content, parentId, guestNickname, guestPassword}) {
    const body = {content, parentId};
    if (!auth.isLoggedIn) {
        body.guestNickname = guestNickname ?? $('#guestNickname').value.trim();
        body.guestPassword = guestPassword ?? $('#guestPassword').value;
    }
    return api('/api/v1/comments', {method: 'POST', body});
}

function onListClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const commentEl = btn.closest('.comment');
    const commentId = Number(commentEl.dataset.id);

    switch (btn.dataset.action) {
        case 'reply':
            toggleReplyForm(commentEl, commentId);
            break;
        case 'edit':
            startEdit(commentEl, commentId);
            break;
        case 'delete':
            deleteComment(commentEl, commentId);
            break;
    }
}

function toggleReplyForm(rootEl, parentId) {
    const slot = rootEl.querySelector('.reply-form-slot');
    if (slot.innerHTML) {
        slot.innerHTML = '';
        return;
    }
    slot.innerHTML = `
        <form class="reply-form" novalidate>
            ${auth.isLoggedIn ? '' : `
                <div class="guest-fields">
                    <input type="text" class="reply-nick" placeholder="닉네임" maxlength="20">
                    <input type="password" class="reply-pw" placeholder="비밀번호" maxlength="30">
                </div>`}
            <textarea class="reply-content" rows="2" placeholder="답글을 입력하세요"></textarea>
            <p class="form-error"></p>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-sm">답글 등록</button>
            </div>
        </form>`;
    slot.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = slot.querySelector('.form-error');
        const content = slot.querySelector('.reply-content').value.trim();
        const nickname = slot.querySelector('.reply-nick')?.value.trim() ?? '';
        const password = slot.querySelector('.reply-pw')?.value ?? '';

        const invalid = validateComment({
            needGuest: !auth.isLoggedIn,
            nickname,
            password,
            content,
            contentLabel: '답글',
        });
        if (invalid) {
            errorEl.textContent = invalid;
            return;
        }
        errorEl.textContent = '';

        try {
            await createComment({content, parentId, guestNickname: nickname, guestPassword: password});
            loadComments(currentPage);
        } catch (err) {
            errorEl.textContent = err.message;
        }
    });
}

function startEdit(commentEl, commentId) {
    const contentEl = commentEl.querySelector('.comment-content');
    if (commentEl.querySelector('.edit-form')) return;

    const original = contentEl.textContent;
    contentEl.style.display = 'none';
    const form = document.createElement('form');
    form.className = 'edit-form';
    form.noValidate = true;
    form.innerHTML = `
        <textarea class="edit-content" rows="2">${escapeHtml(original)}</textarea>
        <p class="form-error"></p>
        <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-sm">저장</button>
            <button type="button" class="btn btn-ghost btn-sm" data-cancel>취소</button>
        </div>`;
    contentEl.after(form);

    form.querySelector('[data-cancel]').addEventListener('click', () => {
        form.remove();
        contentEl.style.display = '';
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = form.querySelector('.form-error');
        const content = form.querySelector('.edit-content').value.trim();
        if (!content) {
            errorEl.textContent = '댓글 내용을 입력해주세요.';
            return;
        }
        errorEl.textContent = '';

        const updateApi = (guestPassword) =>
            api(`/api/v1/comments/${commentId}`, {
                method: 'PUT',
                body: {content, guestPassword},
            });

        const isGuest = commentEl.querySelector('.badge').textContent === '게스트';
        if (isGuest) {
            // 모달을 띄운 채 API를 호출하고, 비밀번호 불일치 등 실패는 모달 안에 표시됨
            const done = await openCommentModal({
                title: '댓글 수정',
                desc: '작성 시 입력한 비밀번호를 입력하세요.',
                password: true,
                onConfirm: updateApi,
            });
            if (done == null) return; // 취소
            loadComments(currentPage);
            return;
        }
        try {
            await updateApi(null);
            loadComments(currentPage);
        } catch (err) {
            errorEl.textContent = err.message;
        }
    });
}

async function deleteComment(commentEl, commentId) {
    const isGuest = commentEl.querySelector('.badge').textContent === '게스트';
    const deleteApi = (guestPassword) =>
        api(`/api/v1/comments/${commentId}`, {method: 'DELETE', body: {guestPassword}});

    // 모달을 띄운 채 API를 호출하고, 실패(비밀번호 불일치 등)는 모달 안에 표시됨
    const done = isGuest
        ? await openCommentModal({
            title: '댓글 삭제',
            desc: '작성 시 입력한 비밀번호를 입력하세요.',
            password: true,
            onConfirm: deleteApi,
        })
        : await openCommentModal({
            title: '댓글 삭제',
            desc: '댓글을 삭제할까요?',
            onConfirm: () => deleteApi(null),
        });
    if (done == null) return; // 취소
    loadComments(currentPage);
}

function renderPagination(data) {
    const el = $('#pagination');
    if (data.totalPages <= 1) {
        el.innerHTML = '';
        return;
    }
    let html = '';
    for (let i = 0; i < data.totalPages; i++) {
        html += `<button type="button" data-page="${i}" class="${i === data.page ? 'active' : ''}">${i + 1}</button>`;
    }
    el.innerHTML = html;
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
