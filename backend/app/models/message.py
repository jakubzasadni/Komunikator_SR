from app import db
from datetime import datetime


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    # Exactly one of recipient_id or room_id must be set
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=True)
    content = db.Column(db.Text, nullable=False)
    delivered = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "room_id": self.room_id,
            "content": self.content,
            "delivered": self.delivered,
            "created_at": self.created_at.isoformat(),
        }
