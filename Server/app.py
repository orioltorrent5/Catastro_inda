from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import geopandas as gpd
from sqlalchemy import create_engine
import json

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Inda!576074!@localhost:5432/catastro'
db = SQLAlchemy(app)

# Ruta para obtener los datos catastrales en formato GeoJSON
@app.route('/api/catastral')
def get_catastral():
    try:
        print("Conectando a la base de datos...")
        # Fem la consulta a la base de dades, on hi ha les dades SHA penjades.
        engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
        gdf_result = gpd.read_postgis('SELECT * FROM catastral', engine, geom_col='geometry')

        print("Convirtiendo el GeoDataFrame a GeoJSON...")
        geojson_data = gdf_result.to_json()
        geojson_data = jsonify(json.loads(geojson_data)) # Ens assegurem que s'envia en geojson.
        
        return geojson_data
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
