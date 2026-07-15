import {initAuth} from './auth.js';
import {initComments, onAuthChanged} from './comments.js';
import {initTheme} from './theme.js';
import {initCloudLogo} from './cloudLogo.js';
import {initScrollSpy} from './scrollSpy.js';
import {initIcons} from './icons.js';
import {initCopyText} from './copyText.js';
import {initVisitor} from './visitor.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth(onAuthChanged);
    initComments();
    initCloudLogo();
    initScrollSpy();
    initIcons();
    initCopyText();
    initVisitor();
});
