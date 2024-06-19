from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import geopandas as gpd
from sqlalchemy import create_engine, text
import json
from geoalchemy2 import Geometry

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Inda!576074!@localhost:5432/catastro'
db = SQLAlchemy(app)

# Definició de la taula catastral
class Catastral(db.Model):
    __tablename__ = 'catastral'
    MAPA = db.Column(db.BigInteger)
    DELEGACIO = db.Column(db.BigInteger)
    MUNICIPIO = db.Column(db.BigInteger)
    MASA = db.Column(db.Text)
    HOJA = db.Column(db.Text)
    TIPO = db.Column(db.Text)
    PARCELA = db.Column(db.Text)
    COORX = db.Column(db.Float)
    COORY = db.Column(db.Float)
    VIA = db.Column(db.BigInteger)
    NUMERO = db.Column(db.Float)
    NUMERODUP = db.Column(db.Text)
    NUMSYMBOL = db.Column(db.BigInteger)
    AREA = db.Column(db.BigInteger)
    FECHAALTA = db.Column(db.BigInteger)
    FECHABAJA = db.Column(db.BigInteger)
    NINTERNO = db.Column(db.Float, primary_key=True)
    PCAT1 = db.Column(db.Text)
    PCAT2 = db.Column(db.Text)
    EJERCICIO = db.Column(db.BigInteger)
    NUM_EXP = db.Column(db.BigInteger)
    CONTROL = db.Column(db.BigInteger)
    REFCAT = db.Column(db.Text)
    geometry = db.Column(Geometry('POLYGON', 25831))
    COBERTURA = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'type': 'Feature',
            'geometry': json.loads(db.session.scalar(self.geometry.ST_AsGeoJSON())),
            'properties': {
                'ID': self.NINTERNO,
                'MAPA': self.MAPA,
                'DELEGACIO': self.DELEGACIO,
                'MUNICIPIO': self.MUNICIPIO,
                'MASA': self.MASA,
                'HOJA': self.HOJA,
                'TIPO': self.TIPO,
                'PARCELA': self.PARCELA,
                'COORX': self.COORX,
                'COORY': self.COORY,
                'VIA': self.VIA,
                'NUMERO': self.NUMERO,
                'NUMERODUP': self.NUMERODUP,
                'NUMSYMBOL': self.NUMSYMBOL,
                'AREA': self.AREA,
                'FECHAALTA': self.FECHAALTA,
                'FECHABAJA': self.FECHABAJA,
                'NINTERIOR': self.NINTERNO,
                'PCAT1': self.PCAT1,
                'PCAT2': self.PCAT2,
                'EJERCICIO': self.EJERCICIO,
                'NUM_EXP': self.NUM_EXP,
                'CONTROL': self.CONTROL,
                'REFCAT': self.REFCAT,
                'COBERTURA': self.COBERTURA
            }
        }

# Ruta per obtenir les dades cadastrals en format GeoJSON
@app.route('/api/catastral')
def get_catastral():
    try:
        print("Conectando a la base de datos...")
        engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
        gdf_result = gpd.read_postgis('SELECT * FROM catastral', engine, geom_col='geometry')

        print("Convirtiendo el GeoDataFrame a GeoJSON...")
        geojson_data = gdf_result.to_json()
        geojson_data = jsonify(json.loads(geojson_data))  # Ens assegurem que s'envia en geojson.
        
        return geojson_data
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


# Ruta per actualitzar la cobertura d'un registre específic
@app.route('/api/update_cobertura/<NINTERNO>', methods=['POST'])
def update_cobertura(NINTERNO):
    try:
        cobertura = request.json['COBERTURA']
        engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
        with engine.connect() as connection:
            update_query = 'UPDATE catastral SET "COBERTURA" = {cobertura} WHERE "NINTERNO" = {ninterno}'.format(cobertura=cobertura, ninterno=NINTERNO)
            print(update_query); 
            result = connection.execute(text(update_query))
            connection.commit()

            if result.rowcount == 0:
                return jsonify({"error": "Registro no encontrado"}), 404
            print(f"Cobertura actualitzada per NINTERNO: {NINTERNO} a {cobertura}")
            return jsonify({"success": True}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
