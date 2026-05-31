from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app import socketio, db
from app.models.message import Message
from app.sockets.session_store import add_session, remove_session, get_socket_ids, get_user_id_by_socket


def _authenticate() -> int | None:
    """Extract and validate JWT from query param or auth header. Returns user_id or None."""
    token = request.args.get("token")
    if not token:
        auth = request.headers.get("Authorization", "")
        token = auth.removeprefix("Bearer ").strip() or None
    if not token:
        return None
    try:
        data = decode_token(token)
        return int(data["sub"])
    except Exception:
        return None


@socketio.on("connect")
def on_connect():
    user_id = _authenticate()
    if user_id is None:
        return False  # reject connection

    add_session(user_id, request.sid)
    emit("user_status", {"user_id": user_id, "online": True}, broadcast=True)

    from app.models.room import RoomMember
    memberships = RoomMember.query.filter_by(user_id=user_id).all()
    for m in memberships:
        join_room(str(m.room_id))


@socketio.on("disconnect")
def on_disconnect():
    user_id = get_user_id_by_socket(request.sid)
    if user_id is None:
        return

    remove_session(user_id, request.sid)
    still_online = bool(get_socket_ids(user_id))
    if not still_online:
        emit("user_status", {"user_id": user_id, "online": False}, broadcast=True)


@socketio.on("private_message")
def on_private_message(data):
    sender_id = get_user_id_by_socket(request.sid)
    if sender_id is None:
        return

    recipient_id = int(data["to_user_id"])
    content = data["content"]

    msg = Message(sender_id=sender_id, recipient_id=recipient_id, content=content)
    db.session.add(msg)
    db.session.commit()

    payload = msg.to_dict()
    recipient_sids = get_socket_ids(recipient_id)
    for sid in recipient_sids:
        emit("message", payload, to=sid)

    if recipient_sids:
        msg.delivered = True
        db.session.commit()
        emit("ack", {"message_id": msg.id}, to=request.sid)


@socketio.on("room_message")
def on_room_message(data):
    sender_id = get_user_id_by_socket(request.sid)
    if sender_id is None:
        return

    room_id = int(data["room_id"])
    content = data["content"]

    msg = Message(sender_id=sender_id, room_id=room_id, content=content)
    db.session.add(msg)
    db.session.commit()

    emit("room_message", msg.to_dict(), to=str(room_id), include_self=True)


@socketio.on("join_room")
def on_join_room(data):
    room_id = str(data["room_id"])
    join_room(room_id)


@socketio.on("leave_room")
def on_leave_room(data):
    room_id = str(data["room_id"])
    leave_room(room_id)


@socketio.on("typing")
def on_typing(data):
    sender_id = get_user_id_by_socket(request.sid)
    if sender_id is None:
        return
    recipient_id = int(data["to_user_id"])
    for sid in get_socket_ids(recipient_id):
        emit("typing", {"from_user_id": sender_id}, to=sid)
