from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.room import Room, RoomMember
from app.models.message import Message

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.get("/")
@jwt_required()
def list_rooms():
    user_id = int(get_jwt_identity())
    memberships = RoomMember.query.filter_by(user_id=user_id).all()
    rooms = []
    for m in memberships:
        room = Room.query.get(m.room_id)
        if room:
            rooms.append(room.to_dict())
    return jsonify(rooms), 200


@rooms_bp.post("/")
@jwt_required()
def create_room():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "Missing field: name"}), 400

    room = Room(name=data["name"], created_by=user_id)
    db.session.add(room)
    db.session.flush()
    db.session.add(RoomMember(room_id=room.id, user_id=user_id))
    db.session.commit()
    return jsonify(room.to_dict()), 201


@rooms_bp.post("/<int:room_id>/join")
@jwt_required()
def join_room_http(room_id):
    user_id = int(get_jwt_identity())
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404

    if not RoomMember.query.filter_by(room_id=room_id, user_id=user_id).first():
        db.session.add(RoomMember(room_id=room_id, user_id=user_id))
        db.session.commit()
    return jsonify({"message": "Joined", "room": room.to_dict()}), 200


@rooms_bp.get("/<int:room_id>/messages")
@jwt_required()
def room_messages(room_id):
    user_id = int(get_jwt_identity())
    if not RoomMember.query.filter_by(room_id=room_id, user_id=user_id).first():
        return jsonify({"error": "Not a member of this room"}), 403

    messages = (
        Message.query.filter_by(room_id=room_id)
        .order_by(Message.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([m.to_dict() for m in reversed(messages)]), 200
