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
