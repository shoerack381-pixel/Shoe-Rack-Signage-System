import re

with open('styles.css','r') as f:
    css = f.read()

# 1. Update body
css = re.sub(r'width:\s*1080px;\s*height:\s*1920px;', r'width: 100vw;\n    height: 100dvh;', css)

# 2. Update Clock Header
css = re.sub(r'padding:\s*80px\s*40px\s*60px;\s*height:\s*480px;', r'padding: clamp(20px, 4vh, 80px) 4%;\n    flex-basis: 25%;', css)

# 3. Update Clock segments and values
css = re.sub(r'padding:\s*30px\s*40px\s*20px;\s*min-width:\s*250px;', r'padding: clamp(10px, 2vh, 30px) clamp(15px, 3vw, 40px);\n    min-width: 22%;', css)
css = re.sub(r'font-size:\s*140px;', r'font-size: clamp(3rem, 12vw, 140px);', css)
css = re.sub(r'font-size:\s*100px;', r'font-size: clamp(2rem, 8vw, 100px);', css)
css = re.sub(r'font-size:\s*120px;', r'font-size: clamp(2.5rem, 10vw, 120px);', css)

# 4. Update Header Subtitle
css = re.sub(r'font-size:\s*60px;\s*margin-top:\s*40px;', r'font-size: clamp(1.5rem, 4vw, 55px);\n    margin-top: clamp(10px, 2vh, 30px);', css)

# 5. Update Slides 
css = re.sub(r'min-width:\s*1080px;\s*height:\s*1440px;\s*padding:\s*60px\s*30px;\s*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*40px;', r'width: 100%;\n    height: 100%;\n    padding: 3vh 4vw;\n    display: flex;\n    flex-direction: column;\n    gap: 2.5vh;', css)

# 6. Update Cards - Using Aspect Ratio!
css = re.sub(r'gap:\s*60px;\s*width:\s*100%;\s*padding:\s*0\s*240px\s*0\s*140px;\s*/\*\s*240px[^*]*\*/\s*/\*\s*Use[^*]*\*/\s*background:\s*url\([^)]+\)\s*center\s*/\s*100%\s*100%\s*no-repeat;[^{}]*height:\s*300px;[^{}]*flex-shrink:\s*0;', r'''gap: 4%;
    width: 100%;
    aspect-ratio: 4 / 1.15;
    padding: 0 20% 0 12%; 
    background: url('images/Box%20t.png?v=999') center / 100% 100% no-repeat;
    border: none;
    border-radius: 0;
    box-shadow: none;
    transition: var(--transition-smooth);
    position: relative;
    overflow: visible;
    opacity: 0;
    transform: translateY(2vh);
    flex: 1;
    max-height: 25vh;''', css)

# 7. Update Icon Setup
css = re.sub(r'width:\s*150px;\s*/\*\s*Perfectly[^*]*\*/\s*height:\s*150px;', r'height: 55%;\n    aspect-ratio: 1;', css)

# 8. Update Instruction Text
css = re.sub(r'font-size:\s*42px;\s*/\*\s*Flawless[^*]*\*/\s*color:\s*#3b3523;\s*line-height:\s*1\.8;\s*/\*[^*]*\*/\s*font-weight:\s*700;\s*text-align:\s*right;\s*direction:\s*rtl;\s*position:\s*relative;\s*display:\s*flex;\s*align-items:\s*center;\s*justify-content:\s*flex-start;\s*width:\s*100%;\s*padding-right:\s*12px;\s*text-shadow:[^;]+;\s*margin-top:\s*35px;', r'''font-size: clamp(1rem, 3.5vw, 42px); 
    color: #3b3523;
    line-height: 1.6; 
    font-weight: 700;
    text-align: right;
    direction: rtl;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding-right: 2%;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
    margin-top: clamp(8px, 1.5vh, 25px);''', css)

with open('styles.css','w') as f:
    f.write(css)

print("Responsive upgrades injected into styles.css")
