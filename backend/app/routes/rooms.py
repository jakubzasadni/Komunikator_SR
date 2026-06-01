from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.room import Room, RoomMember
from app.models.message import Message
from app.models.user import User

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


@rooms_bp.get("/available")
@jwt_required()
def available_rooms():
    user_id = int(get_jwt_identity())
    member_ids = {m.room_id for m in RoomMember.query.filter_by(user_id=user_id).all()}
    rooms = Room.query.filter(Room.id.notin_(member_ids)).all() if member_ids else Room.query.all()
    return jsonify([r.to_dict() for r in rooms]), 200


@rooms_bp.get("/all")
@jwt_required()
def all_rooms():
    user_id = int(get_jwt_identity())
    member_ids = {m.room_id for m in RoomMember.query.filter_by(user_id=user_id).all()}
    result = []
    for room in Room.query.order_by(Room.created_at).all():
        members = (
            db.session.query(User)
            .join(RoomMember, RoomMember.user_id == User.id)
            .filter(RoomMember.room_id == room.id)
            .all()
        )
        data = room.to_dict()
        data["is_member"] = room.id in member_ids
        data["members"] = [{"id": u.id, "username": u.username} for u in members]
        result.append(data)
    return jsonify(result), 200


@rooms_bp.post("/<int:room_id>/invite")
@jwt_required()
def invite_user(room_id):
    owner_id = int(get_jwt_identity())
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    if room.created_by != owner_id:
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json(silent=True) or {}
    target_id = data.get("user_id")
    if not target_id:
        return jsonify({"error": "Missing user_id"}), 400
    if not RoomMember.query.filter_by(room_id=room_id, user_id=target_id).first():
        db.session.add(RoomMember(room_id=room_id, user_id=int(target_id)))
        db.session.commit()
        from app import socketio
        from app.sockets.session_store import get_socket_ids
        for sid in get_socket_ids(int(target_id)):
            socketio.emit("room_invite", room.to_dict(), to=sid)
    return jsonify(room.to_dict()), 200


@rooms_bp.delete("/<int:room_id>/members/<int:uid>")
@jwt_required()
def remove_member(room_id, uid):
    owner_id = int(get_jwt_identity())
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    if room.created_by != owner_id:
        return jsonify({"error": "Forbidden"}), 403
    member = RoomMember.query.filter_by(room_id=room_id, user_id=uid).first()
    if member:
        db.session.delete(member)
        db.session.commit()
    return jsonify({"message": "Removed"}), 200


@rooms_bp.delete("/<int:room_id>")
@jwt_required()
def delete_room(room_id):
    owner_id = int(get_jwt_identity())
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    if room.created_by != owner_id:
        return jsonify({"error": "Forbidden"}), 403
    RoomMember.query.filter_by(room_id=room_id).delete()
    Message.query.filter_by(room_id=room_id).delete()
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
