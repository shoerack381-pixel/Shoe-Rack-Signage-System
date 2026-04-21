import re

with open('styles.css','r') as f:
    css = f.read()

# 1. Clock Segments - Remove rigid min-widths, add flex: 1, fix padding
css = re.sub(r'padding:\s*clamp\(10px,\s*2vh,\s*30px\)\s*clamp\(15px,\s*3vw,\s*40px\);\s*min-width:\s*22%;', 
             r'padding: clamp(5px, 1vh, 30px) clamp(5px, 1.5vw, 40px);\n    flex: 1;\n    min-width: 0;', css)

# 2. Clock Values - Better scaling
css = re.sub(r'font-size:\s*clamp\(3rem,\s*12vw,\s*140px\);', 
             r'font-size: clamp(2rem, 8vw, 140px);', css)
css = re.sub(r'font-size:\s*clamp\(2rem,\s*8vw,\s*100px\);', 
             r'font-size: clamp(1.5rem, 6vw, 100px);', css)

# 3. Clock Labels & separators
css = re.sub(r'font-size:\s*24px;\s*font-weight:\s*600;\s*color:\s*rgba\(255,\s*255,\s*255,\s*0.35\);\s*letter-spacing:\s*6px;\s*text-transform:\s*uppercase;\s*margin-top:\s*15px;', 
             r'font-size: clamp(8px, 1.5vw, 24px);\n    font-weight: 600;\n    color: rgba(255, 255, 255, 0.35);\n    letter-spacing: clamp(1px, 0.5vw, 6px);\n    text-transform: uppercase;\n    margin-top: clamp(2px, 1vh, 15px);', css)

css = re.sub(r'font-size:\s*clamp\(2.5rem,\s*10vw,\s*120px\);\s*font-weight:\s*600;\s*color:\s*rgba\(255,\s*255,\s*255,\s*0.5\);\s*line-height:\s*1;\s*margin-bottom:\s*25px;', 
             r'font-size: clamp(1.5rem, 6vw, 120px);\n    font-weight: 600;\n    color: rgba(255, 255, 255, 0.5);\n    line-height: 1;\n    margin-bottom: clamp(5px, 2vh, 25px);', css)

# 4. Clock AMPM
css = re.sub(r'font-size:\s*45px;\s*font-weight:\s*700;\s*color:\s*rgba\(212,\s*168,\s*67,\s*0.9\);\s*letter-spacing:\s*4px;\s*background:\s*rgba\(0,\s*0,\s*0,\s*0.3\);\s*border:\s*1px\s*solid\s*rgba\(212,\s*168,\s*67,\s*0.2\);\s*border-radius:\s*12px;\s*padding:\s*15px\s*25px;\s*margin-left:\s*20px;\s*align-self:\s*center;\s*margin-bottom:\s*20px;', 
             r'font-size: clamp(1rem, 3.5vw, 45px);\n    font-weight: 700;\n    color: rgba(212, 168, 67, 0.9);\n    letter-spacing: clamp(1px, 0.5vw, 4px);\n    background: rgba(0, 0, 0, 0.3);\n    border: 1px solid rgba(212, 168, 67, 0.2);\n    border-radius: clamp(4px, 1vw, 12px);\n    padding: clamp(5px, 1vh, 15px) clamp(8px, 1.5vw, 25px);\n    margin-left: clamp(5px, 1vw, 20px);\n    align-self: center;\n    margin-bottom: clamp(5px, 1.5vh, 20px);', css)

# 5. Header Subtitle
css = re.sub(r'margin-top:\s*clamp\(10px,\s*2vh,\s*30px\);\s*/\*\s*color:[^*]*\*/', 
             r'margin-top: clamp(10px, 2vh, 30px);\n', css)

# 6. Card Frame Geometry
css = re.sub(r'padding:\s*0\s*18%\s*0\s*12%;', 
             r'padding: 0 22% 0 13%;', css)

# 7. Icon strict bounding
css = re.sub(r'height:\s*55%;\s*aspect-ratio:\s*1;', 
             r'height: 50%;\n    aspect-ratio: 1;\n    margin-top: 0;', css)

with open('styles.css','w') as f:
    f.write(css)

print("Mobile geometry flawlessly updated.")
