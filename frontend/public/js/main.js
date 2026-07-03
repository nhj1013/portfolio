import {initAuth} from './auth.js';
import {initComments, onAuthChanged} from './comments.js';
import {initTheme} from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth(onAuthChanged);
    initComments();
});
