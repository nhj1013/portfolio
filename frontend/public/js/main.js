import {initAuth} from './auth.js';
import {initComments, onAuthChanged} from './comments.js';
import {initTheme} from './theme.js';
import {initCloudLogo} from './cloudLogo.js';
import {initScrollSpy} from './scrollSpy.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth(onAuthChanged);
    initComments();
    initCloudLogo();
    initScrollSpy();
});
