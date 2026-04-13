from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint
from app.models.message import Message
from sqlalchemy import or_, and_

messages_bp = Blueprint("messages", __name__)


@messages_bp.get("/<int:other_user_id>")
@jwt_required()
def private_history(other_user_id):
    user_id = int(get_jwt_identity())
    messages = (
        Message.query.filter(
            Message.room_id.is_(None),
            or_(
                and_(Message.sender_id == user_id, Message.recipient_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.recipient_id == user_id),
            ),
        )
        .order_by(Message.created_at.asc())
        .limit(100)
        .all()
    )
    return jsonify([m.to_dict() for m in messages]), 200
