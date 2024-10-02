# Script to import new Geometries into the assets database

The script takes a geopackage file as input and creates two files:

- a file `sgsids.txt` which contains all sgsids whose geometries are to be updated
- a SQL Script `import_geometries.sql` which, for each asset with a relevant sgsid, deletes the existing geometries and inserts the new ones

Getting started:

- Install Python 3.12
- Install requirements.txt
- Adjust the parameters in at the top of `main.py`
- Run `main.py`
- Run the resulting SQL Script directly in the database. In case of a large number of geometries, consider running the script in smaller transaction blocks. Tools like Datagrip can do this directly.
