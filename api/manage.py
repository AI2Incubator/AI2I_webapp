from flask import Flask
from flask.cli import FlaskGroup
from flask_cors import CORS


def create_app(script_info=None):
    app = Flask(__name__)
    CORS(app)

    from api import api_blueprint
    app.register_blueprint(api_blueprint)

    # shell context for flask cli
    @app.shell_context_processor
    def ctx():
        return {'app': app}

    return app


app = create_app()
cli = FlaskGroup(create_app=create_app)

if __name__ == '__main__':
    cli()
