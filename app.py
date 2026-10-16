import os, json, sqlite3, smtplib
from datetime import datetime
from email.message import EmailMessage
from flask import Flask, render_template, request, jsonify, abort
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
DB_PATH = os.path.join(BASE_DIR, "brandstudio.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                design_type TEXT NOT NULL DEFAULT 'poster',
                canvas_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS enquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                company TEXT NOT NULL DEFAULT '',
                email TEXT NOT NULL,
                service TEXT NOT NULL,
                message TEXT NOT NULL DEFAULT '',
                email_sent INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

def send_enquiry_email(name, company, email, service, message):
    """Send an enquiry using SMTP credentials supplied in environment/.env."""
    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    receiver = os.getenv("CONTACT_RECEIVER", "").strip()
    if not all((host, user, password, receiver)):
        return False, "Email is not configured yet. The enquiry was saved by the website."

    msg = EmailMessage()
    msg["Subject"] = f"New Yashnu Creative enquiry — {service}"
    msg["From"] = os.getenv("SMTP_FROM", user).strip() or user
    msg["To"] = receiver
    msg["Reply-To"] = email
    msg.set_content(
        "New enquiry received from the Yashnu Creative website.\n\n"
        f"Name: {name}\nCompany / brand: {company or 'Not provided'}\n"
        f"Email: {email}\nService: {service}\n\nMessage:\n{message or 'No additional message'}\n"
    )
    port = int(os.getenv("SMTP_PORT", "587"))
    timeout = int(os.getenv("SMTP_TIMEOUT", "15"))
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=timeout) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=timeout) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.send_message(msg)
        return True, "Your enquiry was emailed to Yashnu Creative."
    except (smtplib.SMTPException, OSError, ValueError) as exc:
        app.logger.exception("Could not email website enquiry")
        return False, "Your enquiry was saved, but email delivery failed. Please contact us by WhatsApp or phone."

@app.route("/")
def index():
    return render_template("index.html")

@app.post("/api/contact")
def contact_enquiry():
    data = request.get_json(silent=True) or request.form.to_dict()
    name = str(data.get("name", "")).strip()[:120]
    company = str(data.get("company", "")).strip()[:160]
    email = str(data.get("email", "")).strip()[:254]
    service = str(data.get("service", "")).strip()[:100]
    message = str(data.get("message", "")).strip()[:5000]
    if not name or not email or not service or "@" not in email:
        return jsonify({"ok": False, "message": "Please enter your name, a valid email address, and choose a service."}), 400
    created_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO enquiries(name, company, email, service, message, email_sent, created_at) VALUES(?,?,?,?,?,0,?)",
            (name, company, email, service, message, created_at),
        )
        enquiry_id = cur.lastrowid
    sent, status = send_enquiry_email(name, company, email, service, message)
    if sent:
        with db() as conn:
            conn.execute("UPDATE enquiries SET email_sent=1 WHERE id=?", (enquiry_id,))
    return jsonify({"ok": True, "email_sent": sent, "message": status}), 200

@app.route("/editor")
def editor():
    project_id = request.args.get("id", type=int)
    project = None
    if project_id:
        with db() as conn:
            project = conn.execute("SELECT * FROM projects WHERE id=?", (project_id,)).fetchone()
        if not project:
            abort(404)
        project = dict(project)
        project["canvas_json"] = json.loads(project["canvas_json"])
    return render_template("editor.html", project=project)

@app.get("/api/projects")
def list_projects():
    with db() as conn:
        rows = conn.execute("SELECT id, name, design_type, created_at, updated_at FROM projects ORDER BY updated_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.post("/api/projects")
def save_project():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "Untitled design")).strip()[:100] or "Untitled design"
    design_type = str(data.get("design_type", "poster"))[:30]
    canvas_data = data.get("canvas")
    if not isinstance(canvas_data, dict):
        return jsonify({"error": "Canvas data is required"}), 400
    now = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    project_id = data.get("id")
    with db() as conn:
        if project_id and conn.execute("SELECT id FROM projects WHERE id=?", (project_id,)).fetchone():
            conn.execute("UPDATE projects SET name=?, design_type=?, canvas_json=?, updated_at=? WHERE id=?",
                         (name, design_type, json.dumps(canvas_data), now, project_id))
            saved_id = project_id
        else:
            cur = conn.execute("INSERT INTO projects(name, design_type, canvas_json, created_at, updated_at) VALUES(?,?,?,?,?)",
                               (name, design_type, json.dumps(canvas_data), now, now))
            saved_id = cur.lastrowid
    return jsonify({"id": saved_id, "name": name, "message": "Project saved"})

@app.post("/api/upload")
def upload_image():
    image = request.files.get("image")
    if not image or not image.filename:
        return jsonify({"error": "Choose an image first"}), 400
    ext = image.filename.rsplit(".", 1)[-1].lower() if "." in image.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Supported formats: PNG, JPG, JPEG, WEBP, GIF"}), 400
    import secrets
    filename = secrets.token_hex(12) + "." + ext
    image.save(os.path.join(UPLOAD_DIR, filename))
    return jsonify({"url": "/static/uploads/" + filename})

@app.delete("/api/projects/<int:project_id>")
def delete_project(project_id):
    with db() as conn:
        cur = conn.execute("DELETE FROM projects WHERE id=?", (project_id,))
    if cur.rowcount == 0:
        return jsonify({"error": "Project not found"}), 404
    return jsonify({"message": "Project deleted"})

@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "File is too large. Maximum upload size is 12 MB."}), 413

init_db()

if __name__ == "__main__":
    app.run(debug=True)
