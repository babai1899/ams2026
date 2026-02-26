import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_mail import Mail, Message as MailMessage
import zipfile
from io import BytesIO
import logging

app = Flask(__name__)
app.secret_key = "supersecretkey"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
mail = Mail(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "home"

# ================= DATABASE MODELS =================

class Admin(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))

class Requirement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(200))
    place = db.Column(db.String(100))
    positions = db.Column(db.String(200))
    job_type = db.Column(db.String(50))  # Full Time, Part Time
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    contact = db.Column(db.String(20))
    message = db.Column(db.Text)

class CV(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    contact = db.Column(db.String(20))
    filename = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Marquee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(300))

class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    father_name = db.Column(db.String(100))
    mother_name = db.Column(db.String(100))
    dob = db.Column(db.String(20))
    gender = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    alt_phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    marital_status = db.Column(db.String(20))
    blood_group = db.Column(db.String(10))
    address = db.Column(db.Text)
    role = db.Column(db.String(50))
    userid = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(200))
    photo = db.Column(db.String(200))
    status = db.Column(db.String(20), default='Active')
    login_access = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    notification_type = db.Column(db.String(50))  # cv, message, job, staff, marquee, backup, settings
    title = db.Column(db.String(200))
    description = db.Column(db.String(500))
    icon = db.Column(db.String(10))  # emoji icon
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

# ================= NOTIFICATION FUNCTIONS =================

def create_notification(notification_type, title, description, icon):
    """Create a new notification"""
    notification = Notification(
        notification_type=notification_type,
        title=title,
        description=description,
        icon=icon
    )
    db.session.add(notification)
    db.session.commit()
    return notification

# ================= LOGIN =================

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(Admin, int(user_id))

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = Admin.query.filter_by(username=data["username"]).first()

    if user and bcrypt.check_password_hash(user.password, data["password"]):
        login_user(user)
        return jsonify({"success": True})

    return jsonify({"success": False}), 401

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("home"))

# ================= ADMIN DASHBOARD =================

@app.route("/admin-dashboard")
@login_required
def admin_dashboard():
    requirements = Requirement.query.all()
    messages = Message.query.all()
    cvs = CV.query.all()
    marquee = Marquee.query.first()
    return render_template("admin_dashboard.html",
                           requirements=requirements,
                           messages=messages,
                           cvs=cvs,
                           marquee=marquee)

# ================= JOB/REQUIREMENT ROUTES =================

@app.route("/add-job", methods=["POST"])
@login_required
def add_job():
    """Add a new job/requirement"""
    try:
        new_req = Requirement(
            company=request.form.get("companyName"),
            place=request.form.get("place"),
            positions=request.form.get("positions"),
            job_type=request.form.get("jobType"),
            description=request.form.get("description", "")
        )
        db.session.add(new_req)
        db.session.commit()
        
        # Create notification for new job
        create_notification(
            notification_type="job",
            title="New Job Added",
            description=f"Job posting: {request.form.get('positions')} at {request.form.get('companyName')}",
            icon="💼"
        )
        
        return jsonify({"success": True, "message": "Job added successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route("/get-jobs")
def get_jobs():
    """Get all jobs for public display"""
    requirements = Requirement.query.all()
    return jsonify([{
        "id": r.id,
        "company": r.company,
        "place": r.place,
        "positions": r.positions,
        "job_type": r.job_type,
        "description": r.description,
        "created_at": r.created_at.strftime("%d %b %Y") if r.created_at else ""
    } for r in requirements])

@app.route("/get-jobs-admin")
@login_required
def get_jobs_admin():
    """Get all jobs for admin panel"""
    requirements = Requirement.query.all()
    return jsonify([{
        "id": r.id,
        "company": r.company,
        "place": r.place,
        "positions": r.positions,
        "job_type": r.job_type,
        "description": r.description,
        "created_at": r.created_at.strftime("%d %b %Y") if r.created_at else ""
    } for r in requirements])

@app.route("/delete-job/<int:id>", methods=["DELETE"])
@login_required
def delete_job(id):
    """Delete a job"""
    try:
        req = Requirement.query.get(id)
        if req:
            job_info = f"{req.positions} at {req.company}" if req.positions and req.company else "a job"
            db.session.delete(req)
            db.session.commit()
            
            # Create notification for job deletion
            create_notification(
                notification_type="job",
                title="Job Deleted",
                description=f"Job posting removed: {job_info}",
                icon="🗑"
            )
            
            return jsonify({"success": True, "message": "Job deleted successfully!"})
        return jsonify({"success": False, "message": "Job not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ================= MESSAGES =================

@app.route("/submit-message", methods=["POST"])
def submit_message():
    data = request.json
    new_message = Message(
        name=data.get("name"),
        email=data.get("email"),
        contact=data.get("contact"),
        message=data.get("message")
    )
    db.session.add(new_message)
    db.session.commit()
    
    # Create notification for new message
    create_notification(
        notification_type="message",
        title="New Contact Message",
        description=f"Message received from {data.get('name')}",
        icon="✉"
    )
    
    return jsonify({"success": True}), 201

@app.route("/delete-message/<int:id>")
@login_required
def delete_message(id):
    msg = Message.query.get(id)
    db.session.delete(msg)
    db.session.commit()
    return redirect(url_for("admin_dashboard"))

@app.route("/get-messages")
@login_required
def get_messages():
    messages = Message.query.all()
    return jsonify([{
        "id": msg.id,
        "name": msg.name,
        "email": msg.email,
        "message": msg.message
    } for msg in messages])

# ================= CV UPLOAD =================

@app.route("/upload-cv", methods=["POST"])
def upload_cv():
    try:
        file = request.files.get("cv")
        name = request.form.get("name")
        email = request.form.get("email")
        contact = request.form.get("phone")

        if file and name:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            new_cv = CV(name=name, email=email, contact=contact, filename=filename)
            db.session.add(new_cv)
            db.session.commit()

            # Send Email Notification
            try:
                msg = MailMessage(
                    subject="New CV Uploaded",
                    recipients=["bd700084@gmail.com"],
                    body=f"New CV uploaded by {name}\nFile: {filename}"
                )
                mail.send(msg)
            except:
                pass

            # Create notification for new CV
            create_notification(
                notification_type="cv",
                title="New CV Uploaded",
                description=f"CV uploaded by {name}",
                icon="📄"
            )

            return jsonify({"success": True, "message": "CV uploaded successfully"})
        
        return jsonify({"success": False, "message": "Missing required fields"})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route("/delete-cv/<int:id>")
@login_required
def delete_cv(id):
    cv = CV.query.get(id)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], cv.filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    db.session.delete(cv)
    db.session.commit()
    return redirect(url_for("admin_dashboard"))

@app.route("/download-cvs")
@login_required
def download_cvs():

    memory_file = BytesIO()

    with zipfile.ZipFile(memory_file, 'w') as zf:
        for cv in CV.query.all():
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], cv.filename)
            if os.path.exists(file_path):
                zf.write(file_path, arcname=cv.filename)


    memory_file.seek(0)

    return send_file(memory_file,
                     download_name="all_cvs.zip",
                     as_attachment=True)

# ================= MARQUEE =================

@app.route("/get-marquee")
def get_marquee():
    """Get the current marquee text"""
    marquee = Marquee.query.first()
    if marquee:
        return jsonify({"text": marquee.text})
    return jsonify({"text": ""})

@app.route("/update-marquee", methods=["POST"])
@login_required
def update_marquee():
    text = request.form.get("text", "")
    marquee = Marquee.query.first()

    if marquee:
        marquee.text = text
    else:
        marquee = Marquee(text=text)
        db.session.add(marquee)

    db.session.commit()
    
    # Create notification for marquee update
    create_notification(
        notification_type="marquee",
        title="Marquee Updated",
        description="Notification marquee has been updated",
        icon="📢"
    )
    
    return jsonify({"success": True, "message": "Marquee updated successfully!"})

# ================= CHART DATA ROUTE =================

@app.route("/dashboard-stats")
@login_required
def dashboard_stats():
    cvs = CV.query.all()
    messages = Message.query.all()

    # Count CV uploads per day
    daily_counts = {}
    for cv in cvs:
        day = cv.created_at.strftime("%Y-%m-%d")
        daily_counts[day] = daily_counts.get(day, 0) + 1

    return jsonify({
        "cv_total": len(cvs),
        "message_total": len(messages),
        "daily_uploads": daily_counts
    })

# ================= DOWNLOAD ALL CVs =================

@app.route("/download-all-cvs")
def download_all_cvs():
    folder = app.config['UPLOAD_FOLDER']
    zip_path = "all_cvs.zip"

    # Check if folder exists
    if not os.path.exists(folder):
        return "No uploads found", 404

    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for file in os.listdir(folder):
            file_path = os.path.join(folder, file)
            if os.path.isfile(file_path):
                zipf.write(file_path, file)

    return send_file(zip_path, as_attachment=True)

# ================= NOTIFICATIONS =================

@app.route("/get-notifications")
@login_required
def get_notifications():
    """Get all notifications for admin panel"""
    notifications = Notification.query.order_by(Notification.created_at.desc()).all()
    return jsonify([{
        "id": n.id,
        "notification_type": n.notification_type,
        "title": n.title,
        "description": n.description,
        "icon": n.icon,
        "created_at": n.created_at.strftime("%d %b %Y, %I:%M %p") if n.created_at else "",
        "is_read": n.is_read
    } for n in notifications])

@app.route("/clear-notifications", methods=["POST"])
@login_required
def clear_notifications():
    """Clear all notifications"""
    Notification.query.delete()
    db.session.commit()
    return "", 204

@app.route("/mark-notification-read/<int:id>", methods=["POST"])
@login_required
def mark_notification_read(id):
    """Mark a notification as read"""
    notification = Notification.query.get(id)
    if notification:
        notification.is_read = True
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

# ================= CLEAR MESSAGES =================

@app.route("/clear-messages", methods=["POST"])
def clear_messages():
    Message.query.delete()
    db.session.commit()
    return "", 204

# ================= STAFF MANAGEMENT =================

@app.route("/add-staff", methods=["POST"])
@login_required
def add_staff():
    try:
        photo_filename = None
        if 'photo' in request.files:
            photo = request.files['photo']
            if photo and photo.filename:
                photo_filename = secure_filename(photo.filename)
                photo.save(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))
        
        hashed_password = bcrypt.generate_password_hash(request.form.get('password', '')).decode('utf-8')
        
        new_staff = Staff(
            name=request.form.get('name'),
            father_name=request.form.get('father_name'),
            mother_name=request.form.get('mother_name'),
            dob=request.form.get('dob'),
            gender=request.form.get('gender'),
            phone=request.form.get('phone'),
            alt_phone=request.form.get('alt_phone'),
            email=request.form.get('email'),
            marital_status=request.form.get('marital_status'),
            blood_group=request.form.get('blood_group'),
            address=request.form.get('address'),
            role=request.form.get('role'),
            userid=request.form.get('userid'),
            password=hashed_password,
            photo=photo_filename,
            status='Active',
            login_access=True
        )
        db.session.add(new_staff)
        db.session.commit()
        
        # Create notification for new staff
        create_notification(
            notification_type="staff",
            title="New Staff Added",
            description=f"Staff member added: {request.form.get('name')} as {request.form.get('role')}",
            icon="👤"
        )
        
        return jsonify({"success": True, "message": "Staff added successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route("/get-staff")
@login_required
def get_staff():
    staff_list = Staff.query.all()
    return jsonify([{
        "id": s.id,
        "name": s.name,
        "userid": s.userid,
        "role": s.role,
        "status": s.status,
        "login_access": s.login_access,
        "photo": s.photo,
        "email": s.email,
        "phone": s.phone
    } for s in staff_list])

@app.route("/delete-staff/<int:id>")
@login_required
def delete_staff(id):
    staff = Staff.query.get(id)
    if staff:
        staff_name = staff.name
        if staff.photo:
            photo_path = os.path.join(app.config['UPLOAD_FOLDER'], staff.photo)
            if os.path.exists(photo_path):
                os.remove(photo_path)
        db.session.delete(staff)
        db.session.commit()
        
        # Create notification for staff deletion
        create_notification(
            notification_type="staff",
            title="Staff Deleted",
            description=f"Staff member removed: {staff_name}",
            icon="🗑"
        )
        
    return redirect(url_for("admin_dashboard"))

@app.route("/toggle-staff-status/<int:id>", methods=["POST"])
@login_required
def toggle_staff_status(id):
    staff = Staff.query.get(id)
    if staff:
        staff.status = 'Inactive' if staff.status == 'Active' else 'Active'
        db.session.commit()
        
        # Create notification for staff status change
        create_notification(
            notification_type="staff",
            title="Staff Status Changed",
            description=f"Staff member {staff.name} is now {staff.status}",
            icon="🔄"
        )
        
        return jsonify({"success": True, "status": staff.status})
    return jsonify({"success": False}), 404

@app.route("/toggle-staff-login/<int:id>", methods=["POST"])
@login_required
def toggle_staff_login(id):
    staff = Staff.query.get(id)
    if staff:
        staff.login_access = not staff.login_access
        db.session.commit()
        
        # Create notification for login access change
        create_notification(
            notification_type="staff",
            title="Login Access Changed",
            description=f"Login access for {staff.name}: {'Enabled' if staff.login_access else 'Disabled'}",
            icon="🔑"
        )
        
        return jsonify({"success": True, "login_access": staff.login_access})
    return jsonify({"success": False}), 404

# ================= EXPORT STAFF TO EXCEL =================

@app.route("/export-staff")
def export_staff():
    try:
        staff_list = Staff.query.all()
        if not staff_list:
            return jsonify({"error": "No staff data to export"}), 404
        
        import csv
        output = BytesIO()
        output.write('\ufeff'.encode('utf-8'))
        
        writer = csv.writer(output)
        writer.writerow(['Name', 'User ID', 'Role', 'Email', 'Phone', 'Status', 'Login Access'])
        
        for s in staff_list:
            writer.writerow([
                s.name or '',
                s.userid or '',
                s.role or '',
                s.email or '',
                s.phone or '',
                s.status or '',
                'Yes' if s.login_access else 'No'
            ])
        
        output.seek(0)
        return send_file(output, download_name="staff_export.csv", as_attachment=True, mimetype='text/csv')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= WEBSITE BACKUP =================

@app.route("/backup-website")
def backup_website():
    backup_name = "website_backup.zip"

    with zipfile.ZipFile(backup_name, 'w') as zipf:

        for folder, subfolders, files in os.walk("."):
            if "venv" in folder or "__pycache__" in folder:
                continue

            for file in files:
                filepath = os.path.join(folder, file)
                zipf.write(filepath)

    return send_file(backup_name, as_attachment=True)

backup_progress = {
    "percent": 0,
    "current": 0,
    "total": 0,
    "status": "Idle",
    "cancelled": False
}

@app.route("/start-backup", methods=["POST"])
def start_backup():
    from threading import Thread
    backup_progress.update({
        "percent": 0,
        "current": 0,
        "total": 0,
        "status": "Preparing...",
        "cancelled": False
    })
    Thread(target=create_backup).start()
    
    # Create notification for backup start
    create_notification(
        notification_type="backup",
        title="Backup Started",
        description="Website backup process has been initiated",
        icon="🔒"
    )
    
    return "", 202

@app.route("/cancel-backup", methods=["POST"])
def cancel_backup():
    backup_progress["cancelled"] = True
    backup_progress["status"] = "Cancelling..."
    return "", 200

def create_backup():
    files = []
    for root, dirs, filenames in os.walk("."):
        if "venv" in root or "__pycache__" in root:
            continue
        for f in filenames:
            files.append(os.path.join(root, f))

    total = len(files)
    backup_progress["total"] = total

    zip_name = "website_backup.zip"

    with zipfile.ZipFile(zip_name, 'w') as zipf:
        for i, file in enumerate(files):

            if backup_progress["cancelled"]:
                break

            zipf.write(file)

            backup_progress["current"] = i + 1
            backup_progress["percent"] = int((i+1)/total * 100)
            backup_progress["status"] = f"Backing up {os.path.basename(file)}"

    if backup_progress["cancelled"]:
        backup_progress["status"] = "Backup cancelled"
        return

    backup_progress["status"] = "Backup completed"
    
    # Create notification for backup completion
    create_notification(
        notification_type="backup",
        title="Backup Completed",
        description="Website backup has been completed successfully",
        icon="✅"
    )

@app.route("/backup-progress")
def backup_progress_status():
    return backup_progress

@app.route("/download-backup")
def download_backup():
    return send_file("website_backup.zip", as_attachment=True)

# ================= CLEAR CV UPLOADS =================

@app.route("/clear-cv-uploads", methods=["POST"])
def clear_cv_uploads():
    folder = app.config['UPLOAD_FOLDER']

    if os.path.exists(folder):
        for file in os.listdir(folder):
            file_path = os.path.join(folder, file)
            if os.path.isfile(file_path):
                os.remove(file_path)

    return "", 204

# ================= SYSTEM LOGS PANEL =================
LOG_FILE = "system.log"

logger = logging.getLogger("system_logger")
logger.setLevel(logging.INFO)

handler = logging.FileHandler(LOG_FILE)
formatter = logging.Formatter('%(asctime)s|%(levelname)s|%(message)s')
handler.setFormatter(formatter)

logger.addHandler(handler)

def log_event(level, message):
    if level == "info":
        logger.info(message)
    elif level == "warning":
        logger.warning(message)
    elif level == "error":
        logger.error(message)
    elif level == "security":
        logger.critical("[SECURITY] " + message)

@app.route("/get-logs")
def get_logs():
    logs = []

    if not os.path.exists(LOG_FILE):
        return []

    with open(LOG_FILE) as f:
        for line in f.readlines()[-200:]:
            parts = line.strip().split("|", 2)
            if len(parts) == 3:
                logs.append({
                    "time": parts[0],
                    "level": parts[1].lower(),
                    "message": parts[2]
                })

    return logs

@app.route("/download-logs")
def download_logs():
    return send_file(LOG_FILE, as_attachment=True)

@app.route("/clear-logs", methods=["POST"])
def clear_logs():
    open(LOG_FILE, "w").close()
    return "", 204

# ================= CHANGE PASSWORD =================

@app.route("/change-password", methods=["POST"])
@login_required
def change_password():

    current_password = request.form.get("current")
    new_password = request.form.get("new")

    if not current_password or not new_password:
        return jsonify({"status": "error", "message": "Missing required fields"})

    # Verify current password
    if not bcrypt.check_password_hash(current_user.password, current_password):
        return jsonify({"status": "error", "message": "Current password is incorrect"})

    # Update password
    current_user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    
    # Create notification for password change
    create_notification(
        notification_type="settings",
        title="Password Changed",
        description="Admin password has been updated successfully",
        icon="🔐"
    )
    
    return jsonify({"status": "success", "message": "Password updated successfully"})

# ================= INIT DATABASE =================

with app.app_context():
    db.create_all()
    
    # Add contact column to Message table if it doesn't exist (for existing databases)
    try:
        from sqlalchemy import text
        result = db.session.execute(text("PRAGMA table_info(message)"))
        columns = [row[1] for row in result]
        if 'contact' not in columns:
            db.session.execute(text("ALTER TABLE message ADD COLUMN contact VARCHAR(20)"))
            db.session.commit()
    except Exception as e:
        print(f"Migration note: {e}")

    # Add email and contact columns to CV table if they don't exist (for existing databases)
    try:
        from sqlalchemy import text
        result = db.session.execute(text("PRAGMA table_info(cv)"))
        columns = [row[1] for row in result]
        if 'email' not in columns:
            db.session.execute(text("ALTER TABLE cv ADD COLUMN email VARCHAR(120)"))
        if 'contact' not in columns:
            db.session.execute(text("ALTER TABLE cv ADD COLUMN contact VARCHAR(20)"))
        db.session.commit()
    except Exception as e:
        print(f"Migration note: {e}")

    # Add columns to Requirement table if they don't exist (for existing databases)
    try:
        from sqlalchemy import text
        result = db.session.execute(text("PRAGMA table_info(requirement)"))
        columns = [row[1] for row in result]
        if 'company' not in columns:
            db.session.execute(text("ALTER TABLE requirement ADD COLUMN company VARCHAR(200)"))
        if 'place' not in columns:
            db.session.execute(text("ALTER TABLE requirement ADD COLUMN place VARCHAR(100)"))
        if 'positions' not in columns:
            db.session.execute(text("ALTER TABLE requirement ADD COLUMN positions VARCHAR(200)"))
        if 'job_type' not in columns:
            db.session.execute(text("ALTER TABLE requirement ADD COLUMN job_type VARCHAR(50)"))
        if 'description' not in columns:
            db.session.execute(text("ALTER TABLE requirement ADD COLUMN description TEXT"))
        if 'created_at' not in columns:
            db.session.execute(text("ALTER TABLE requirement ADD COLUMN created_at DATETIME"))
        db.session.commit()
    except Exception as e:
        print(f"Migration note: {e}")

    if not Admin.query.first():
        admin = Admin(
            username="admin",
            password=bcrypt.generate_password_hash("admin123").decode("utf-8")
        )
        db.session.add(admin)
        db.session.commit()

if __name__ == "__main__":
    app.run(debug=True)
