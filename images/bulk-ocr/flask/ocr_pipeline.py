import gc
import requests
from requests_toolbelt import MultipartEncoder
import threading
from pdfCropMargins import crop
from pdf2image import convert_from_path
import numpy as np
import os
import logging
import cv2
import subprocess


def ocr_pdf(logger: logging.Logger, name: str, pdfpath: str, lngs: str, cpus: int, optimize_level: int, sem):
    filename = pdfpath
    out_filename = filename
    logger.info('Filename: ' + filename)
    logger.info('OUT Filename: ' + out_filename)

    try:
        file_ext = os.path.splitext(filename)[1]
        if file_ext == '.pdf':
            logger.info(
                "Rescale the document if it is too small for the ocr process")
            # Rescale the document if it is too small for the ocr process.
            n_pages = len(convert_from_path(filename, 1))
            pages = convert_from_path(
                filename, 10, first_page=1, last_page=min(5, n_pages + 1))
            if sum([page.width < 20 for page in pages]) > 0:
                images = []
                for i in range(1, n_pages + 1):
                    logger.info(f"Rescaling page {i}")
                    page = convert_from_path(
                        filename, 10, first_page=i, last_page=i)[0]
                    if page.width < 20:
                        image = convert_from_path(
                            filename, 3000, first_page=i, last_page=i)[0]
                        (width, height) = (image.width * 2, image.height * 2)
                        images.append(image.resize((width, height)))
                    else:
                        images.append(convert_from_path(
                            filename, 300, first_page=i, last_page=i)[0])

                images[0].save(filename, "PDF", resolution=300,
                               save_all=True, append_images=images[1:])
                del images

            del pages
            del n_pages
            gc.collect()

            logger.info("DONE - Rescaling the document: " + name)

            cmd = ['ocrmypdf', '-l', lngs, '--skip-big', '30', '--jobs', f"{cpus}", '--optimize', f'{optimize_level}',  '--output-type', 'pdf', '--tesseract-pagesegmode', '1', '--skip-text',  # '--clean',
                   filename, out_filename]
            logger.info(f"running cmd {cmd}")

            cp = subprocess.run(cmd, capture_output=True, timeout=(60*180))
            returncode = cp.returncode
            logger.info(f"DONE ocrmypdf: " + name)
            logger.info(f"returncode: {returncode}")
            logger.debug(f"stderr ocrmypdf {cp.stderr}")
            logger.debug(f"stdout ocrmypdf {cp.stdout}")

            if returncode == 6:
                logger.info(
                    "Skipped document because it already contained text")

            elif returncode == 0:
                logger.info("OCR complete: " + name)
            else:
                logger.error(f'OCR Problem, returncode: {returncode}')
                msg = "OCR Error: {0}; {1}".format(name, cp.stderr)
                logger.error(msg)

            del cp
            gc.collect()
            return out_filename
    except Exception as err:
        msg = "{0}".format(err)
        logger.error(msg)
        raise err
    finally:
        logger.info('sem released')
        sem.release()
