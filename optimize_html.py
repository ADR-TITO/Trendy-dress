import re

try:
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    with open('styles.css', 'r', encoding='utf-8') as f:
        css_lines = f.readlines()

    # Extract critical CSS (first 290 lines approx, up to Category Filter)
    critical_css = ""
    for line in css_lines:
        if "/* Category Filter */" in line:
            break
        critical_css += line

    # Minify critical CSS
    critical_css = re.sub(r'/\*.*?\*/', '', critical_css, flags=re.DOTALL)
    critical_css = re.sub(r'\s+', ' ', critical_css)
    critical_css = critical_css.replace(' {', '{').replace(': ', ':').replace('; ', ';')

    # Replace styles.css link with critical CSS and preload
    css_replacement = f"""
    <style id="critical-css">{critical_css}</style>
    <link rel="preload" href="styles.min.css?v=3.0" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="styles.min.css?v=3.0"></noscript>
    """
    if '<link rel="stylesheet" href="styles.css?v=2.2">' in html:
        html = html.replace('<link rel="stylesheet" href="styles.css?v=2.2">', css_replacement)

    # Update JS refs
    html = html.replace('src="storage-manager.js?v=5.4"', 'src="storage-manager.min.js?v=6.0"')
    html = html.replace('src="api-service.js?v=5.4"', 'src="api-service.min.js?v=6.0"')
    html = html.replace('src="script.js?v=5.4"', 'src="script.min.js?v=6.0"')
    
    # Update script loading to module/async if needed, but defer is already used and good enough

    # Add font preloading for LCP
    fonts = '<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap" as="style">'
    if '<!-- Modern Typography -->' in html:
        html = html.replace('<!-- Modern Typography -->', '<!-- Modern Typography -->\\n    ' + fonts)

    # Minify HTML basically (remove comments, excessive whitespace)
    # Be careful not to break internal JS or text
    html = re.sub(r'<!--(?! slide).*?-->', '', html, flags=re.DOTALL)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("Optimization complete!")
except Exception as e:
    print(f"Error: {e}")
