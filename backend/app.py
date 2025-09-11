"""
Arcania Vault Backend Server (Improved)
Handles Flask API with proper JSON error responses and MySQL connection fixes.
"""

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import hmac
import json
import os
import urllib.parse
import logging

# --- App Configuration ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# --- Logger Setup ---
logging.basicConfig(level=logging.INFO)

# --- Database Configuration ---
USERNAME = "xero1ghost"
# Make sure to URL encode the password automatically
PASSWORD = "parthsharma"


HOST = "xero1ghost.mysql.pythonanywhere-services.com"
DB_NAME = "xero1ghost$arcania_db"

app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    auth_salt = db.Column(db.String(255), nullable=False)
    encryption_salt = db.Column(db.String(255), nullable=False)
    auth_hash = db.Column(db.String(255), nullable=False)
    master_password_check_hash = db.Column(db.String(255), nullable=False)
    encrypted_vault_data = db.Column(db.Text, nullable=True, default='[]')

    def __repr__(self):
        return f'<User {self.email}>'

# --- JSON Error Handler (IMPORTANT) ---
@app.errorhandler(Exception)
def handle_exception(e):
    """Ensure all unhandled exceptions return JSON instead of HTML"""
    logging.exception("Internal Server Error: %s", e)
    return jsonify({"error": "Internal server error", "details": str(e)}), 500

# --- API Endpoints ---
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        required_fields = ['email', 'authSalt', 'encryptionSalt', 'authHash', 'masterPasswordCheckHash']
        if not all(k in data for k in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "An account with this email already exists."}), 409

        new_user = User(
            email=data['email'],
            auth_salt=data['authSalt'],
            encryption_salt=data['encryptionSalt'],
            auth_hash=data['authHash'],
            master_password_check_hash=data['masterPasswordCheckHash'],
            encrypted_vault_data='[]'
        )

        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Signup successful!"}), 201

    except Exception as e:
        db.session.rollback()
        logging.exception("Signup failed: %s", e)
        return jsonify({"error": "Database error", "details": str(e)}), 500

@app.route('/api/get-salts/<email>', methods=['GET'])
def get_salts(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"authSalt": user.auth_salt}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not all(k in data for k in ['email', 'providedAuthHash']):
        return jsonify({"error": "Missing email or hash"}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    try:
        is_valid = hmac.compare_digest(data['providedAuthHash'], user.auth_hash)
    except Exception:
        is_valid = False

    if is_valid:
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid email or password."}), 401

@app.route('/api/get-unlock-data/<email>', methods=['GET'])
def get_unlock_data(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({
        "encryptionSalt": user.encryption_salt,
        "masterPasswordCheckHash": user.master_password_check_hash
    }), 200

@app.route('/api/get-vault/<email>', methods=['GET'])
def get_vault(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(json.loads(user.encrypted_vault_data or '[]')), 200

@app.route('/api/save-vault/<email>', methods=['POST'])
def save_vault(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        encrypted_data_array = request.json
        user.encrypted_vault_data = json.dumps(encrypted_data_array)
        db.session.commit()
        return jsonify({"message": "Vault saved successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logging.exception("Vault save failed: %s", e)
        return jsonify({"error": "Database error", "details": str(e)}), 500

@app.route('/api/delete-account', methods=['POST'])
def delete_account():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Account successfully deleted"}), 200
    except Exception as e:
        db.session.rollback()
        logging.exception("Delete account failed: %s", e)
        return jsonify({"error": "Database error", "details": str(e)}), 500

# --- Main Entry Point ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
