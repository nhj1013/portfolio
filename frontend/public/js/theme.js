// ============================================
// ✅ 다크모드 토글 (localStorage 로 유지)
// ============================================
const THEME_KEY = 'portfolio.theme';

export function initTheme() {
    const icon = document.getElementById('darkModeIcon');
    applyTheme(currentTheme(), icon);

    icon.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next, icon);
    });
}

function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme, icon) {
    document.documentElement.dataset.theme = theme;
    icon.src = theme === 'dark' ? '/images/dark-mode-2.png' : '/images/dark-mode-1.png';
}
