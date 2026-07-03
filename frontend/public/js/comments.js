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
    refreshGuestFields();
    loadComments(0);
}

// 로그인 상태 변경 시 호출
export function onAuthChanged() {
    refreshGuestFields();
    loadComments(currentPage);
}

function refreshGuestFields() {
    $('#guestFields').style.display = auth.isLoggedIn ? 'none' : '';
    document.querySelectorAll('#guestFields input').forEach((input) => {
        input.required = !auth.isLoggedIn;
    });
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
    const content = $('#commentContent').value.trim();
    if (!content) return;

    try {
        await createComment({content, parentId: null});
        $('#commentForm').reset();
        loadComments(0);
    } catch (err) {
        alert(err.message);
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
        <form class="reply-form">
            ${auth.isLoggedIn ? '' : `
                <div class="guest-fields">
                    <input type="text" class="reply-nick" placeholder="닉네임" minlength="2" maxlength="20" required>
                    <input type="password" class="reply-pw" placeholder="비밀번호" minlength="4" maxlength="30" required>
                </div>`}
            <textarea class="reply-content" rows="2" placeholder="답글을 입력하세요" required></textarea>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-sm">답글 등록</button>
            </div>
        </form>`;
    slot.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await createComment({
                content: slot.querySelector('.reply-content').value.trim(),
                parentId,
                guestNickname: slot.querySelector('.reply-nick')?.value.trim(),
                guestPassword: slot.querySelector('.reply-pw')?.value,
            });
            loadComments(currentPage);
        } catch (err) {
            alert(err.message);
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
    form.innerHTML = `
        <textarea class="edit-content" rows="2" required>${escapeHtml(original)}</textarea>
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
        const isGuest = commentEl.querySelector('.badge').textContent === '게스트';
        let guestPassword = null;
        if (isGuest) {
            guestPassword = prompt('작성 시 입력한 비밀번호를 입력하세요.');
            if (guestPassword == null) return;
        }
        try {
            await api(`/api/v1/comments/${commentId}`, {
                method: 'PUT',
                body: {content: form.querySelector('.edit-content').value.trim(), guestPassword},
            });
            loadComments(currentPage);
        } catch (err) {
            alert(err.message);
        }
    });
}

async function deleteComment(commentEl, commentId) {
    const isGuest = commentEl.querySelector('.badge').textContent === '게스트';
    let guestPassword = null;
    if (isGuest) {
        guestPassword = prompt('작성 시 입력한 비밀번호를 입력하세요.');
        if (guestPassword == null) return;
    } else if (!confirm('댓글을 삭제할까요?')) {
        return;
    }
    try {
        await api(`/api/v1/comments/${commentId}`, {method: 'DELETE', body: {guestPassword}});
        loadComments(currentPage);
    } catch (err) {
        alert(err.message);
    }
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
