from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from app import db, bcrypt
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


def _require_fields(data, *fields):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    return None


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    err = _require_fields(data, "username", "email", "password")
    if err:
        return err

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already in use"}), 409
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409

    is_first = User.query.count() == 0
    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = User(username=data["username"], email=data["email"], password_hash=hashed)
    user.is_admin = is_first
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created", "user_id": user.id}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    err = _require_fields(data, "email", "password")
    if err:
        return err

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 200


@auth_bp.post("/logout")
@jwt_required()
def logout():
    # Stateless JWT — client discards token and disconnects Socket.IO
    return jsonify({"message": "Logged out"}), 200
