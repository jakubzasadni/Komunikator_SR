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
    rooms = [Room.query.get(m.room_id).to_dict() for m in memberships]
    return jsonify(rooms), 200


@rooms_bp.post("/")
@jwt_required()
def create_room():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    room = Room(name=data["name"], created_by=user_id)
    db.session.add(room)
    db.session.flush()
    db.session.add(RoomMember(room_id=room.id, user_id=user_id))
    db.session.commit()
    return jsonify(room.to_dict()), 201


@rooms_bp.post("/<int:room_id>/join")
@jwt_required()
def join_room(room_id):
    user_id = int(get_jwt_identity())
    if not RoomMember.query.filter_by(room_id=room_id, user_id=user_id).first():
        db.session.add(RoomMember(room_id=room_id, user_id=user_id))
        db.session.commit()
    return jsonify({"message": "Joined"}), 200


@rooms_bp.get("/<int:room_id>/messages")
@jwt_required()
def room_messages(room_id):
    messages = (
        Message.query.filter_by(room_id=room_id)
        .order_by(Message.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([m.to_dict() for m in reversed(messages)]), 200
