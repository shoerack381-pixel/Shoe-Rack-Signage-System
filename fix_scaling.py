import re

with open('styles.css','r') as f:
    text = f.read()

# Make the magic variable root hook
hook = """
html {
    /* Responsive root baseline mapping exactly to 1080x1920 logical constraints */
    font-size: calc(min(100vw / 108, 100vh / 192));
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000;
}
"""

def px_to_rem(match):
    val = float(match.group(1))
    if val == 0: return "0"
    return f"{val/10:g}rem"

# Regex handles integers or decimals before 'px'
mod_text = re.sub(r'(\d+(?:\.\d+)?)px', px_to_rem, text)

# Fix edge case 1px borders which shouldn't convert to 0.1rem unless desired; 0.1rem actually scales! 
# We'll let it convert. But we must prepend the html root hook
final_css = hook + mod_text

with open('styles.css','w') as f:
    f.write(final_css)

print("Styles scaled successfully.")

