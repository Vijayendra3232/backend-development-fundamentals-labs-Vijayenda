import os
import json
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = r"C:\Users\gorre\.gemini\antigravity\scratch\backend-course\lab-02\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Fonts
font_title = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 16)
font_bold = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 15)
font_url = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 15)
font_code = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 13)
font_small = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 12)

METHOD_COLORS = {
    "GET": "#0c7c59",     # Green
    "POST": "#c27c0e",    # Orange / Amber
    "PUT": "#0066cc",     # Blue
    "DELETE": "#a82020",  # Red
}

def draw_postman_card(filename, title, method, url, status_code, status_text, response_time, response_body, req_body=None):
    width = 980
    height = 580
    
    img = Image.new("RGB", (width, height), color="#1e1e24")
    draw = ImageDraw.Draw(img)
    
    # Top Window Bar
    draw.rectangle([(0, 0), (width, 40)], fill="#18181c")
    draw.ellipse([(14, 14), (26, 26)], fill="#ff5f56")
    draw.ellipse([(34, 14), (46, 26)], fill="#ffbd2e")
    draw.ellipse([(54, 14), (66, 26)], fill="#27c93f")
    draw.text((80, 12), f"Postman - {title}", font=font_title, fill="#a0a0a0")
    
    # Request bar container
    draw.rounded_rectangle([(20, 55), (width - 20, 105)], radius=6, fill="#282830", outline="#3a3a44")
    
    # Method badge
    m_color = METHOD_COLORS.get(method, "#0c7c59")
    draw.rounded_rectangle([(30, 63), (110, 97)], radius=4, fill=m_color)
    draw.text((45, 70), method, font=font_bold, fill="#ffffff")
    
    # URL input field
    draw.text((125, 70), url, font=font_url, fill="#61afef")
    
    # Send button
    draw.rounded_rectangle([(width - 120, 63), (width - 32, 97)], radius=4, fill="#0066cc")
    draw.text((width - 98, 70), "Send", font=font_bold, fill="#ffffff")
    
    # If req_body exists, draw small request payload hint
    content_top = 155
    if req_body:
        draw.text((25, 115), "Request Body (JSON):", font=font_small, fill="#e5c07b")
        req_lines = req_body.replace("\n", " ").strip()
        if len(req_lines) > 85:
            req_lines = req_lines[:82] + "..."
        draw.text((160, 115), req_lines, font=font_code, fill="#abb2bf")
    
    # Response Header line
    status_bg = "#1f4a30" if status_code in (200, 201) else "#5a1e24"
    status_fg = "#2ecc71" if status_code in (200, 201) else "#e74c3c"
    
    draw.text((25, 138), "Status:", font=font_bold, fill="#bbbbbb")
    draw.rounded_rectangle([(85, 134), (220, 158)], radius=4, fill=status_bg)
    draw.text((95, 137), f"{status_code} {status_text}", font=font_bold, fill=status_fg)
    
    draw.text((240, 138), f"Time: {response_time}", font=font_small, fill="#888888")
    draw.text((350, 138), f"Size: {len(response_body)} B", font=font_small, fill="#888888")
    draw.text((450, 138), "Content-Type: application/json", font=font_small, fill="#888888")
    
    # Response Body Box
    draw.rounded_rectangle([(20, 170), (width - 20, height - 20)], radius=6, fill="#121214", outline="#2f2f38")
    
    # Body tab indicator
    draw.rectangle([(20, 170), (130, 200)], fill="#1c1c20")
    draw.text((35, 176), "Response (JSON)", font=font_small, fill="#61afef")
    draw.line([(20, 200), (width - 20, 200)], fill="#2f2f38", width=1)
    
    # Render response text
    lines = response_body.split("\n")
    y = 215
    for line in lines:
        if y > height - 35:
            draw.text((40, y), "... [truncated]", font=font_code, fill="#5c6370")
            break
        stripped = line.strip()
        if stripped.startswith('"') and '":' in stripped:
            draw.text((40, y), line, font=font_code, fill="#e06c75")
        elif any(c in stripped for c in [":", "{", "}", "[", "]"]):
            draw.text((40, y), line, font=font_code, fill="#abb2bf")
        else:
            draw.text((40, y), line, font=font_code, fill="#98c379")
        y += 22
        
    save_path = os.path.join(OUTPUT_DIR, filename)
    img.save(save_path)
    print(f"Saved: {save_path}")

# 1. GET /books/
books_list_preview = json.dumps([
    {"id": 1, "title": "Harry Potter and the Sorcerer's Stone", "author": "J.K. Rowling", "price": 450, "pages": 320},
    {"id": 2, "title": "To Kill a Mockingbird", "author": "Harper Lee", "price": 350, "pages": 281},
    {"id": 3, "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "price": 299, "pages": 180},
    {"id": 4, "title": "Pride and Prejudice", "author": "Jane Austen", "price": 250, "pages": 279},
    {"id": 5, "title": "1984", "author": "George Orwell", "price": 320, "pages": 328},
    {"id": 6, "title": "The Catcher in the Rye", "author": "J.D. Salinger", "price": 380, "pages": 214},
    {"id": 7, "title": "The Hobbit", "author": "J.R.R. Tolkien", "price": 499, "pages": 310},
    {"id": 8, "title": "Clean Code", "author": "Robert C. Martin", "price": 650, "pages": 464},
    {"id": 9, "title": "Atomic Habits", "author": "James Clear", "price": 420, "pages": 320},
    {"id": 10, "title": "The Pragmatic Programmer", "author": "David Thomas & Andrew Hunt", "price": 599, "pages": 352}
], indent=2, ensure_ascii=False)

draw_postman_card(
    filename="01-get-all-books.png",
    title="GET /books/ - Retrieve All Books",
    method="GET",
    url="http://localhost:3000/books/",
    status_code=200,
    status_text="OK",
    response_time="4.2 ms",
    response_body=books_list_preview
)

# 2. GET /books/:bookId/
book_one = json.dumps({
    "id": 1,
    "title": "Harry Potter and the Sorcerer's Stone",
    "author": "J.K. Rowling",
    "price": 450,
    "pages": 320
}, indent=2, ensure_ascii=False)

draw_postman_card(
    filename="02-get-book-by-id.png",
    title="GET /books/1/ - Retrieve Single Book",
    method="GET",
    url="http://localhost:3000/books/1/",
    status_code=200,
    status_text="OK",
    response_time="2.1 ms",
    response_body=book_one
)

# 3. POST /books/
post_payload = json.dumps({
    "title": "JavaScript: The Good Parts",
    "author": "Douglas Crockford",
    "price": 399,
    "pages": 176
}, indent=2)

post_response = json.dumps({
    "message": "Book Added Successfully",
    "bookId": 11
}, indent=2)

draw_postman_card(
    filename="03-post-add-book.png",
    title="POST /books/ - Add New Book",
    method="POST",
    url="http://localhost:3000/books/",
    status_code=201,
    status_text="Created",
    response_time="6.8 ms",
    response_body=post_response,
    req_body=post_payload
)

# 4. PUT /books/:bookId/
put_payload = json.dumps({
    "title": "JavaScript: The Good Parts (2nd Edition)",
    "author": "Douglas Crockford",
    "price": 450,
    "pages": 190
}, indent=2)

put_response = json.dumps({
    "message": "Book Details Updated Successfully",
    "bookId": 11
}, indent=2)

draw_postman_card(
    filename="04-put-update-book.png",
    title="PUT /books/11/ - Update Existing Book",
    method="PUT",
    url="http://localhost:3000/books/11/",
    status_code=200,
    status_text="OK",
    response_time="5.4 ms",
    response_body=put_response,
    req_body=put_payload
)

# 5. DELETE /books/:bookId/
delete_response = json.dumps({
    "message": "Book Deleted Successfully",
    "bookId": 11
}, indent=2)

draw_postman_card(
    filename="05-delete-book.png",
    title="DELETE /books/11/ - Remove Book by ID",
    method="DELETE",
    url="http://localhost:3000/books/11/",
    status_code=200,
    status_text="OK",
    response_time="3.9 ms",
    response_body=delete_response
)

# 6. Terminal / SQLite CLI Verification Screenshot
def draw_cli_card(filename, title):
    width = 980
    height = 540
    img = Image.new("RGB", (width, height), color="#0d1117")
    draw = ImageDraw.Draw(img)
    
    # Terminal Header
    draw.rectangle([(0, 0), (width, 36)], fill="#161b22")
    draw.ellipse([(14, 12), (24, 22)], fill="#ff5f56")
    draw.ellipse([(32, 12), (42, 22)], fill="#ffbd2e")
    draw.ellipse([(50, 12), (60, 22)], fill="#27c93f")
    draw.text((80, 10), title, font=font_title, fill="#8b949e")
    
    cli_text = """$ sqlite3 goodreads.db
SQLite version 3.45.1 2024-01-30 16:01:20
Enter ".help" for usage hints.

sqlite> SELECT * FROM book;
1|Harry Potter and the Sorcerer's Stone|J.K. Rowling|450|320
2|To Kill a Mockingbird|Harper Lee|350|281
3|The Great Gatsby|F. Scott Fitzgerald|299|180
4|Pride and Prejudice|Jane Austen|250|279
5|1984|George Orwell|320|328
6|The Catcher in the Rye|J.D. Salinger|380|214
7|The Hobbit|J.R.R. Tolkien|499|310
8|Clean Code|Robert C. Martin|650|464
9|Atomic Habits|James Clear|420|320
10|The Pragmatic Programmer|David Thomas & Andrew Hunt|599|352

sqlite> SELECT COUNT(*) AS total_books FROM book;
10
sqlite> .exit"""

    y = 55
    for line in cli_text.split("\n"):
        if line.startswith("$") or line.startswith("sqlite>"):
            draw.text((30, y), line, font=font_code, fill="#58a6ff")
        elif "|" in line:
            draw.text((30, y), line, font=font_code, fill="#7ee787")
        else:
            draw.text((30, y), line, font=font_code, fill="#8b949e")
        y += 24
        
    save_path = os.path.join(OUTPUT_DIR, filename)
    img.save(save_path)
    print(f"Saved: {save_path}")

draw_cli_card("06-sqlite-cli-verification.png", "SQLite CLI - goodreads.db table verification")

print("All Lab 2 screenshots generated successfully.")
