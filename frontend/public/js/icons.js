// data-icon="심볼id" 속성만 붙이면 스프라이트(icons.svg) 아이콘을 채워 넣는다
// 사용 예: <i class="btn-icon" data-icon="icon-google"></i>
const SPRITE_URL = '/images/icons.svg';

export function initIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => {
        const id = el.dataset.icon;
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML =
            `<svg><use href="${SPRITE_URL}#${id}"></use></svg>`;
    });
}
