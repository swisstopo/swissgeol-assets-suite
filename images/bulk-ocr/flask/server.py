#!/usr/bin/python3
from flask.helpers import send_file
from ocr_pipeline import ocr_pdf
from flask import Flask, abort, request, Response, jsonify, make_response, json

import tempfile
import shutil
import argparse
import numpy as np
import cv2
import os
import socket
import logging
import sys
import threading

sem = threading.Semaphore()


class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


# Initialize the Flask application
app = Flask(__name__)

ap = argparse.ArgumentParser()
ap.add_argument("-p", "--port", type=int, required=False, help="port fo app")
ap.add_argument("-c", "--cpus", type=int, required=False,
                help="number of cpu cores")
ap.add_argument("-o", "--optimize", type=int, required=False,
                help="level of optimize, 0 for none")
args = vars(ap.parse_args())

PORT = args["port"]
if(PORT is None):
    PORT = 9991

CPUS = args["cpus"]
if(CPUS is None):
    CPUS = 1

optimize_level = args["optimize"]
if(optimize_level is None):
    optimize_level = 0

print(f'>> running with optimize_level {optimize_level}')
print(f'>> running with {CPUS} cpus')
print(f'>> running on port {PORT}')

# set up logging
root = logging.getLogger()
root.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
root.addHandler(ch)


@ app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@ app.route('/ocr', methods=['POST'])
def ocr():
    filename = request.headers.get('x-filename')
    callback_success = request.headers.get('x-callback-success')
    callback_error = request.headers.get('x-callback-error')

    if not sem.acquire(blocking=False):
        return 'service is busy', 503

    try:
        logging.info(f'API ocr: {filename}')
        logging.info(f'API ocr callback_success: {callback_success}')
        logging.info(f'API ocr callback_error: {callback_error}')

        logging.info('saving file')
        f = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=".pdf")
        f.write(request.data)
        f.flush()
        f.close()
        file_name = f.name
        del f
        del request.data

        logging.info(f'DONE - saving file {file_name}')
        logging.info('ocr_pdf')

        thread = threading.Thread(target=ocr_pdf, kwargs={
                                  'logger': logging, 'name': filename, 'pdfpath': file_name, 'lngs': 'eng', 'cpus': CPUS, 'optimize_level': optimize_level, 'callback_success': callback_success, 'callback_error': callback_error, 'sem': sem})
        thread.start()
        return 'Processing', 201

    except Exception as error:
        if hasattr(error, 'message'):
            message = error.message
        else:
            message = str(error)

        logging.exception(f'API ocr ERROR {filename}')
        sem.release()
        raise InvalidUsage(message, status_code=500)


@ app.route('/')
def state():
    status = {
        "host": socket.gethostname(),
        "port": PORT,
        "cpus": CPUS
    }

    return status


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=PORT, threaded=True)
