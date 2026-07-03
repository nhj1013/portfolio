import {initAuth} from './auth.js';
import {initComments, onAuthChanged} from './comments.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth(onAuthChanged);
    initComments();
});
