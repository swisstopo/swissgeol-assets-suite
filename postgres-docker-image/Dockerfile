FROM postgis/postgis

RUN apt update && \
    apt install -y git make && \
    cd /tmp && \
    git clone https://github.com/michelp/pgjwt.git && \
    cd pgjwt && \
    make install && \
    apt remove -y git make && \
    rm -rf /tmp/pgjwt && \
    apt -y autoremove && \
    apt -y autoclean 
