# Use

Annotate links with forks / stars:

    javascript:

    function init() {
        decorate(document.querySelector('.markdown-body'));
    }

    var script = document.createElement('script');
    script.src = 'https://localhost/github/github-proxy/examples/stats.js?t=' + (new Date().getTime());
    script.onload = init;
    document.body.appendChild(script);

    var style = document.createElement('link');
    style.href = 'https://localhost/github/github-proxy/examples/stats.css?t=' + (new Date().getTime());
    style.rel = 'stylesheet';
    style.type = 'text/css';
    document.head.appendChild(style);
