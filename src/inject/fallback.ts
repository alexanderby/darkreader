const fallbackStyle = document.createElement('style');
if (matchMedia('(prefers-color-scheme: dark)').matches) {
    fallbackStyle.textContent = 'html, body, body :not(iframe) { background-color: #181a1b !important; border-color: #776e62 !important; color: #e8e6e3 !important; }';
    document.documentElement.appendChild(fallbackStyle);
    fallbackStyle.classList.add('darkreader');
    fallbackStyle.classList.add('darkreader--fallback');
    fallbackStyle.media = 'screen';
}
