document.addEventListener('DOMContentLoaded', () => {
  const skipHtmlTags = ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml'].map((v) => `:not(${v})`).join('')
  const ignoreHtmlClasses = ['mathjax_ignore'].map((v) => `:not(.${v})`).join('')
  const requiresMathjax = Array.from(document.body.querySelectorAll('*' + skipHtmlTags + ignoreHtmlClasses))
    .some((el) => el.textContent.match(/\\\(|\$\$|\\\[/))

  if (requiresMathjax) {
    const sc = document.createElement('script')
    sc.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-chtml.min.js')
    sc.setAttribute('integrity', 'sha512-93xLZnNMlYI6xaQPf/cSdXoBZ23DThX7VehiGJJXB76HTTalQKPC5CIHuFX8dlQ5yzt6baBQRJ4sDXhzpojRJA==')
    sc.setAttribute('crossorigin', 'anonymous')
    sc.setAttribute('referrerpolicy', 'no-referrer')
    document.head.appendChild(sc)
  }
})
