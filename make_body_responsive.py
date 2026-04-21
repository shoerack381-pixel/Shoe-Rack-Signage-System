import re
with open('styles.css','r') as f: text = f.read()
text = re.sub(r'width:\s*1080px;\s*height:\s*1920px;', r'width: 100vw;\n    height: 100dvh;', text)
with open('styles.css','w') as f: f.write(text)
print("Body fixed.")
