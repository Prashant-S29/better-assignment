from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()


def create_app(config=None):
    app = Flask(__name__)

    # Config
    if config is None:
        from app.config import Config

        app.config.from_object(Config)
    else:
        app.config.from_object(config)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=[app.config["FRONTEND_URL"]])

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.health_routes import health_bp
    from app.routes.review_routes import review_bp
    from app.routes.share_routes import share_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(review_bp, url_prefix="/api/reviews")
    app.register_blueprint(share_bp, url_prefix="/api/share")

    # Global error handler
    from app.middleware.error_handler import register_error_handlers

    register_error_handlers(app)

    return app
