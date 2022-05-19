from random import randint

from flask import Blueprint
from flask_restful import Resource, Api

api_blueprint = Blueprint('api', __name__)
api = Api(api_blueprint)


def error(message):
    return message, 400


class ApiPing(Resource):
    def get(self):
        return dict(status='success', message='pong!'), 200


class Call(Resource):
    def get(self):
        # random answer
        answer = dict(random_number=(randint(0, 100)))
        return answer, 200


api.add_resource(ApiPing, '/api/ping')
api.add_resource(Call, '/api/call')
