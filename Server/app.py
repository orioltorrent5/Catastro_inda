from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import geopandas as gpd
from sqlalchemy import create_engine
import json
from geoalchemy2 import Geometry  # Assegura't de tenir aquesta importació

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Inda!576074!@localhost:5432/catastro'
db = SQLAlchemy(app)

# Definició del model Catastral
class Catastral(db.Model):
    __tablename__ = 'catastral'
    id = db.Column(db.Integer, primary_key=True)
    mapa = db.Column(db.Integer)
    delegacio = db.Column(db.Integer)
    municipio = db.Column(db.Integer)
    masa = db.Column(db.String)
    hoja = db.Column(db.String)
    tipo = db.Column(db.String)
    parcela = db.Column(db.String)
    coorx = db.Column(db.Float)
    coory = db.Column(db.Float)
    via = db.Column(db.Integer)
    numero = db.Column(db.Float)
    numerodup = db.Column(db.String)
    numsymbol = db.Column(db.Integer)
    area = db.Column(db.Integer)
    fechalta = db.Column(db.Integer)  # Si és una data, canvia a db.Column(db.Date)
    fechabaja = db.Column(db.Integer)  # Si és una data, canvia a db.Column(db.Date)
    ninterior = db.Column(db.Float)
    pcat1 = db.Column(db.String)
    pcat2 = db.Column(db.String)
    ejercicio = db.Column(db.Integer)
    num_exp = db.Column(db.Integer)
    control = db.Column(db.Integer)
    refcat = db.Column(db.String)
    geometry = db.Column(Geometry('POLYGON'))
    cobertura = db.Column(db.Integer, default=0)  # Si és un valor boolean, canvia a db.Boolean

    def to_dict(self):
        return {
            'type': 'Feature',
            'geometry': json.loads(self.geometry),  # Ajusta-ho segons el tipus de dades de 'geometry'
            'properties': {
                'id': self.id,
                'mapa': self.mapa,
                'delegacio': self.delegacio,
                'municipio': self.municipio,
                'masa': self.masa,
                'hoja': self.hoja,
                'tipo': self.tipo,
                'parcela': self.parcela,
                'coorx': self.coorx,
                'coory': self.coory,
                'via': self.via,
                'numero': self.numero,
                'numerodup': self.numerodup,
                'numsymbol': self.numsymbol,
                'area': self.area,
                'fechalta': self.fechalta,
                'fechabaja': self.fechabaja,
                'ninterior': self.ninterior,
                'pcat1': self.pcat1,
                'pcat2': self.pcat2,
                'ejercicio': self.ejercicio,
                'num_exp': self.num_exp,
                'control': self.control,
                'refcat': self.refcat,
                'cobertura': self.cobertura
            }
        }

# Ruta per obtenir les dades cadastrals en format GeoJSON
@app.route('/api/catastral')
def get_catastral():
    try:
        print("Conectando a la base de datos...")
        # Fem la consulta a la base de dades, on hi ha les dades SHA penjades.
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
@app.route('/api/update_cobertura/<int:id>', methods=['POST'])
def update_cobertura(id):
    try:
        # Obtenim el valor de la cobertura del cos de la sol·licitud
        cobertura = request.json['cobertura']
        # Cerquem el registre amb l'identificador especificat
        registro = Catastral.query.get(id)
        if registro:
            # Actualitzem el camp de cobertura del registre
            registro.cobertura = cobertura  # Canviem directament el valor
            # Guardem els canvis a la base de dades
            db.session.commit()
            return jsonify({"success": True}), 200
        return jsonify({"error": "Registro no encontrado"}), 404
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
