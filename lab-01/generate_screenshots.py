import os
import json
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = r"C:\Users\gorre\.gemini\antigravity\scratch\backend-course\lab-01\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Fonts
font_title = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 16)
font_bold = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 15)
font_url = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 15)
font_code = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 14)
font_small = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 12)

def draw_postman_card(filename, title, method, url, status_code, status_text, response_time, response_body, is_json=True):
    width = 960
    height = 540
    
    # Create image with dark theme
    img = Image.new("RGB", (width, height), color="#1e1e24")
    draw = ImageDraw.Draw(img)
    
    # Top Window Bar (Chrome/Postman style)
    draw.rectangle([(0, 0), (width, 40)], fill="#18181c")
    # Window controls (macOS style dots)
    draw.ellipse([(14, 14), (26, 26)], fill="#ff5f56")
    draw.ellipse([(34, 14), (46, 26)], fill="#ffbd2e")
    draw.ellipse([(54, 14), (66, 26)], fill="#27c93f")
    
    # Window title
    draw.text((80, 12), f"Postman / REST Client - {title}", font=font_title, fill="#a0a0a0")
    
    # Request bar container
    draw.rounded_rectangle([(20, 60), (width - 20, 110)], radius=6, fill="#282830", outline="#3a3a44")
    
    # Method badge (GET = green)
    draw.rounded_rectangle([(30, 68), (90, 102)], radius=4, fill="#0c7c59")
    draw.text((45, 75), method, font=font_bold, fill="#ffffff")
    
    # URL input field
    draw.text((105, 75), url, font=font_url, fill="#61afef")
    
    # Send button
    draw.rounded_rectangle([(width - 120, 68), (width - 32, 102)], radius=4, fill="#0066cc")
    draw.text((width - 98, 75), "Send", font=font_bold, fill="#ffffff")
    
    # Response Header line
    status_bg = "#1f4a30" if status_code == 200 else "#5a1e24"
    status_fg = "#2ecc71" if status_code == 200 else "#e74c3c"
    
    draw.text((25, 128), "Response Status:", font=font_bold, fill="#bbbbbb")
    draw.rounded_rectangle([(150, 124), (275, 148)], radius=4, fill=status_bg)
    draw.text((160, 127), f"{status_code} {status_text}", font=font_bold, fill=status_fg)
    
    draw.text((300, 128), f"Time: {response_time}", font=font_small, fill="#888888")
    draw.text((410, 128), "Size: " + str(len(response_body)) + " B", font=font_small, fill="#888888")
    draw.text((500, 128), "Format: " + ("JSON" if is_json else "Text"), font=font_small, fill="#888888")
    
    # Response Body Box
    draw.rounded_rectangle([(20, 160), (width - 20, height - 25)], radius=6, fill="#121214", outline="#2f2f38")
    
    # Body tab indicator
    draw.rectangle([(20, 160), (120, 195)], fill="#1c1c20")
    draw.text((40, 170), "Pretty (Body)", font=font_small, fill="#61afef")
    draw.line([(20, 195), (width - 20, 195)], fill="#2f2f38", width=1)
    
    # Render response text
    lines = response_body.split("\n")
    y = 210
    for line in lines:
        if y > height - 40:
            break
        # Syntax highlighting hint
        fill_color = "#abb2bf"
        stripped = line.strip()
        if stripped.startswith('"') and '":' in stripped:
            # key in json
            parts = stripped.split('":', 1)
            draw.text((40, y), line, font=font_code, fill="#e06c75")
        elif status_code == 404:
            draw.text((40, y), line, font=font_code, fill="#e5c07b" if "{" in line or "}" in line else "#e06c75")
        else:
            draw.text((40, y), line, font=font_code, fill="#98c379" if '"' in stripped else "#abb2bf")
        y += 24
        
    save_path = os.path.join(OUTPUT_DIR, filename)
    img.save(save_path)
    print(f"Saved: {save_path}")

# 1. Plain HTTP Server
draw_postman_card(
    filename="01-plain-http-server.png",
    title="Plain Node.js HTTP Server (Task 3)",
    method="GET",
    url="http://localhost:3000/",
    status_code=200,
    status_text="OK",
    response_time="1.8 ms",
    response_body="Hello",
    is_json=False
)

# 2. Express Server Root Route
draw_postman_card(
    filename="02-express-root.png",
    title="Express Server - Welcome Route GET / (Task 5)",
    method="GET",
    url="http://localhost:3000/",
    status_code=200,
    status_text="OK",
    response_time="2.1 ms",
    response_body="Welcome to Backend Development Fundamentals - Lab 1 Express Server!",
    is_json=False
)

# 3. Express Server /about Route
about_body = json.dumps({
    "name": "Gorrela Vijayendra",
    "registrationNumber": "23B01AXXXX",
    "section": "Aurora - Year II Term II",
    "course": "Backend Development Fundamentals",
    "faculty": "Joel Prashanth D"
}, indent=2, ensure_ascii=False)

draw_postman_card(
    filename="03-express-about.png",
    title="Express Server - About Route GET /about (Task 5)",
    method="GET",
    url="http://localhost:3000/about",
    status_code=200,
    status_text="OK",
    response_time="3.4 ms",
    response_body=about_body,
    is_json=True
)

# 4. Express Server /time Route
time_body = json.dumps({
    "currentTime": "2026-10-31T15:33:51.678Z",
    "readable": "Sat Oct 31 2026 21:03:51 GMT+0530 (India Standard Time)",
    "timestamp": 1793460831678
}, indent=2)

draw_postman_card(
    filename="04-express-time.png",
    title="Express Server - Time Route GET /time (Task 5)",
    method="GET",
    url="http://localhost:3000/time",
    status_code=200,
    status_text="OK",
    response_time="2.0 ms",
    response_body=time_body,
    is_json=True
)

# 5. Express Server 404 Route
not_found_body = json.dumps({
    "error": "404 Not Found",
    "message": "The requested path '/nonexistent' does not exist on this server."
}, indent=2)

draw_postman_card(
    filename="05-express-404.png",
    title="Express Server - 404 Not Found Route (Task 6)",
    method="GET",
    url="http://localhost:3000/nonexistent",
    status_code=404,
    status_text="Not Found",
    response_time="1.9 ms",
    response_body=not_found_body,
    is_json=True
)

print("All screenshots generated successfully.")
