# Catastro_inda

### Guia per Configurar Entorns Virtuals per API en un Servidor de Producció

Guia per Configurar Entorns Virtuals per API en un Servidor de Producció
1. Creació de l'Entorn Virtual
Què és un entorn virtual?
Un entorn virtual és una carpeta aïllada que conté una instal·lació independent de Python i les seves llibreries. Això permet que cada API tingui les seves pròpies dependències sense interferir amb altres projectes o amb el sistema global.

2. Estructura del Servidor de Producció
Estructura Recomanada:
Servidor Producció
  ├── api_cobertura
  │   ├── entorn_cobertura
  │   └── app.py
  ├── api_clients
  │   ├── entorn_clients
  │   └── app.py
  └── api_products
      ├── entorn_products
      └── app.py

Cada API té la seva pròpia carpeta i dins d'aquesta carpeta creem el seu entorn virtual.

3. Creació i Activació de l'Entorn Virtual
Passos:

Navega a la carpeta de l'API:
cd ~/Servidor_Produccio/api_cobertura

Crea l'entorn virtual:
python3 -m venv entorn_cobertura

Activa l'entorn virtual:
source entorn_cobertura/bin/actívate

4. Instal·lació de Llibreries
Amb l'entorn activat, instal·la les llibreries necessàries:
pip install flask

Verifica les llibreries instal·lades:
pip list

5. Executar l'Aplicació
Amb l'entorn activat, pots executar la teva aplicació:
python app.py

6. Desactivar l'Entorn Virtual
Quan hagis acabat, desactiva l'entorn virtual:
deactivate
