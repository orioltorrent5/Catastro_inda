from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import geopandas as gpd
from sqlalchemy import create_engine, text
import json
import pyproj

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Inda!576074!@localhost:5432/catastro'

# Ruta per obtenir les dades cadastrals en format GeoJSON depenent de la bounding box
@app.route('/api/catastral')
def get_catastral():
    try:
        print("Conectando a la base de datos...")
        # Obtener los parámetros de la bounding box
        minx = request.args.get('minx', type=float)
        miny = request.args.get('miny', type=float)
        maxx = request.args.get('maxx', type=float)
        maxy = request.args.get('maxy', type=float)

        print(f"Bounding Box - minx: {minx}, miny: {miny}, maxx: {maxx}, maxy: {maxy}")


        if minx is None or miny is None or maxx is None or maxy is None:
            return jsonify({"error": "Faltan parámetros de la bounding box"}), 400
        
        # Convertir coordenadas de EPSG:4326 a EPSG:25831 
        # Ho fem ja que sino la consulta no surt bé. Perquè el geometry esta en format 25831
        transformer = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:25831", always_xy=True)
        minx, miny = transformer.transform(minx, miny)
        maxx, maxy = transformer.transform(maxx, maxy)

        # Crear la consulta SQL para obtener los datos dentro de la bounding box
        engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
        query = f"""
            SELECT * FROM catastral
            WHERE ST_Intersects(
                geometry,
                ST_MakeEnvelope({minx}, {miny}, {maxx}, {maxy}, 25831)
            )
        """
        gdf_result = gpd.read_postgis(query, engine, geom_col='geometry')

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
    
@app.route('/api/search_address', methods=['GET'])
def search_address():
    print("Searching street..")
    try:
        query = request.args.get('query')
        if not query:
            return jsonify({"error": "Falta el parámetro de búsqueda"}), 400

        engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
        # Agafem la consulta que s'assembla més.
        search_query = text("""
            SELECT * FROM catastral
            WHERE "DIRECCION" ILIKE :query
            ORDER BY "DIRECCION" DESC
            LIMIT 1
        """)
        with engine.connect() as connection:
            result = connection.execute(search_query, {"query": f"%{query}%"}).fetchone()
            if result:
                address = dict(result._mapping)
                print(address)
                return jsonify(address)
            else:
                return jsonify({"error": "No se encontraron direcciones que coincidan"}), 404
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)
