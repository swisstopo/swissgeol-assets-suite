from ocr_pipeline import ocr_pdf

import sys
import logging
import threading

sem = threading.Semaphore()

root = logging.getLogger()
root.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
root.addHandler(ch)

def program(filename):
    try:
        ocr_pdf(pdfpath=filename, logger=logging, name=filename, lngs='eng', cpus=256, optimize_level=0, sem=sem) 
    except Exception as error:
        sem.release()
        raise error

if __name__ == '__main__':
    globals()[sys.argv[1]](sys.argv[2])

# docker run -v /home/wayne/Projects/lambda-it/asset-swissgeol-ch/images/bulk-ocr/volumes/pdfs:/mnt/pdfs registry.lambda-it.ch/lambda/asset-swissgeol/batch-ocr python /app/run_ocr_pipeline.py program /mnt/pdfs/4.pdf
