from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.sockets.session_store import get_online_user_ids

users_bp = Blueprint("users", __name__)


@users_bp.get("/")
@jwt_required()
def list_users():
    online_ids = get_online_user_ids()
    users = User.query.all()
    return jsonify([u.to_dict(online=u.id in online_ids) for u in users]), 200
