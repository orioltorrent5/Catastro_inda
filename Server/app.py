from flask import Flask, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import geopandas as gpd
from sqlalchemy import create_engine
import os

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Inda!576074!@localhost:5432/catastro'
db = SQLAlchemy(app)

# Ruta para obtener los datos catastrales en formato GeoJSON
@app.route('/api/catastral')
def get_catastral():
    engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    gdf_result = gpd.read_postgis('SELECT * FROM catastral', engine, geom_col='geometry')

    # Guardar el GeoDataFrame como un archivo GeoJSON temporal
    geojson_file_path = "./data/catastral_data.geojson"
    gdf_result.to_file(geojson_file_path, driver="GeoJSON")

    return send_file(geojson_file_path, mimetype='application/json')

if __name__ == '__main__':
    # Crear el directorio de datos si no existe
    if not os.path.exists('./data'):
        os.makedirs('./data')
    app.run(debug=True)
