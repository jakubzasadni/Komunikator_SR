from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO(cors_allowed_origins="*", async_mode=os.getenv("SOCKETIO_ASYNC_MODE", "eventlet"))
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "postgresql://komunikator:komunikator@localhost:5432/komunikator_db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.rooms import rooms_bp
    from app.routes.messages import messages_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(rooms_bp, url_prefix="/api/rooms")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    from app.sockets import events  # noqa: F401 — registers socket handlers

    @app.cli.command("seed-admin")
    def seed_admin():
        from app.models.user import User
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@komunikator.local")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if not admin_password:
            print("[seed-admin] ADMIN_PASSWORD not set — skipping")
            return

        existing = User.query.filter_by(email=admin_email).first()
        if existing:
            if not existing.is_admin:
                existing.is_admin = True
                db.session.commit()
                print(f"[seed-admin] {admin_username} already exists — promoted to admin")
            else:
                print(f"[seed-admin] Admin {admin_username} already exists — nothing to do")
            return

        hashed = bcrypt.generate_password_hash(admin_password).decode("utf-8")
        user = User(username=admin_username, email=admin_email, password_hash=hashed, is_admin=True)
        db.session.add(user)
        db.session.commit()
        print(f"[seed-admin] Admin user '{admin_username}' created ({admin_email})")

    return app
