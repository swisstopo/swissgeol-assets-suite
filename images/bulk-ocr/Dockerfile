FROM registry.lambda-it.ch/proxy_cache/library/python:3.8-slim

# limit tesseract to one thread
ENV OMP_THREAD_LIMIT=1

WORKDIR /app
COPY ./flask .

RUN apt-get update \
    && apt-get install -y --no-install-recommends ghostscript icc-profiles-free libxml2 pngquant \
    poppler-utils tesseract-ocr zlib1g \
    && rm -rf /var/lib/apt/lists/* \
    && pip install olefile \
    && pip install -r ./requirements.txt
