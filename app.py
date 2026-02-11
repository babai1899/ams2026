from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ams_super_secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'

db = SQLAlchemy(app)

# ======================
# DATABASE MODELS
# ======================

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    dept = db.Column(db.String(50))
    location = db.Column(db.String(100))
    worktime = db.Column(db.String(50))
    demand_file = db.Column(db.String(200))
    status = db.Column(db.String(20), default="Live")
    expiry_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer)
    name = db.Column(db.String(150))
    phone = db.Column(db.String(20))
    resume_file = db.Column(db.String(200))
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

# ======================
# ROUTES
# ======================

@app.route('/')
def home():
    today = datetime.today().date()
    jobs = Job.query.filter(
        Job.status=="Live",
        Job.expiry_date >= today
    ).all()
    return render_template('index.html')

@app.route('/admin')
def admin_dashboard():
    jobs = Job.query.all()
    return render_template('admin-dashboard.html')

# ======================
# JOB CRUD
# ======================

@app.route('/add_job', methods=['POST'])
def add_job():
    title = request.form['title']
    dept = request.form['dept']
    location = request.form['location']
    worktime = request.form['worktime']
    expiry = request.form['expiry']

    file = request.files['demand']
    filename = None

    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    job = Job(
        title=title,
        dept=dept,
        location=location,
        worktime=worktime,
        demand_file=filename,
        expiry_date=datetime.strptime(expiry, "%Y-%m-%d")
    )

    db.session.add(job)
    db.session.commit()

    return redirect(url_for('admin'))

@app.route('/delete_job/<int:id>')
def delete_job(id):
    job = Job.query.get_or_404(id)
    db.session.delete(job)
    db.session.commit()
    return redirect(url_for('admin'))

# ======================
# APPLY SYSTEM
# ======================

@app.route('/apply/<int:job_id>', methods=['POST'])
def apply(job_id):
    name = request.form['name']
    phone = request.form['phone']
    resume = request.files['resume']

    filename = secure_filename(resume.filename)
    resume.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    application = Application(
        job_id=job_id,
        name=name,
        phone=phone,
        resume_file=filename
    )

    db.session.add(application)
    db.session.commit()

    return jsonify({"status": "success"})

# ======================

if __name__ == '__main__':
    if not os.path.exists('database.db'):
        with app.app_context():
            db.create_all()
    app.run(debug=True)
