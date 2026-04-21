import re

with open('styles.css','r') as f:
    text = f.read()

# Remove the custom html hook
text = re.sub(r'html\s*\{[^}]+\}', '', text)

# Convert rem back to px
def rem_to_px(match):
    val = float(match.group(1))
    return f"{int(val*10)}px"

text = re.sub(r'(\d+(?:\.\d+)?)rem', rem_to_px, text)

# We might also have some vw / vh left over, let's fix the known ones explicitly just in case, but they shouldn't exist if the python script purely did px.
# Actually let's just make sure text size is roughly 50px for the cards to be extremely safe, the previous huge font issue was because of 112px blowups.

with open('styles.css','w') as f:
    f.write(text)

print("Reverted styles directly back to strict pixels.")
