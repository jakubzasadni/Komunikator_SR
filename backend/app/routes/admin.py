from functools import wraps
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.room import Room, RoomMember
from app.models.message import Message

admin_bp = Blueprint("admin", __name__)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = User.query.get(int(get_jwt_identity()))
        if not user or not user.is_admin:
            return jsonify({"error": "Admin required"}), 403
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.get("/users")
@admin_required
def list_users():
    users = User.query.order_by(User.created_at).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.delete("/users/<int:uid>")
@admin_required
def delete_user(uid):
    me = int(get_jwt_identity())
    if uid == me:
        return jsonify({"error": "Cannot delete yourself"}), 400
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    Message.query.filter((Message.sender_id == uid) | (Message.recipient_id == uid)).delete()
    RoomMember.query.filter_by(user_id=uid).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@admin_bp.post("/users/<int:uid>/toggle-admin")
@admin_required
def toggle_admin(uid):
    me = int(get_jwt_identity())
    if uid == me:
        return jsonify({"error": "Cannot change own role"}), 400
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Not found"}), 404
    user.is_admin = not user.is_admin
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.get("/rooms")
@admin_required
def list_rooms():
    rooms = Room.query.order_by(Room.created_at).all()
    result = []
    for room in rooms:
        data = room.to_dict()
        data["member_count"] = RoomMember.query.filter_by(room_id=room.id).count()
        creator = User.query.get(room.created_by)
        data["created_by_username"] = creator.username if creator else "?"
        result.append(data)
    return jsonify(result), 200


@admin_bp.delete("/rooms/<int:room_id>")
@admin_required
def delete_room(room_id):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Not found"}), 404
    RoomMember.query.filter_by(room_id=room_id).delete()
    Message.query.filter_by(room_id=room_id).delete()
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
