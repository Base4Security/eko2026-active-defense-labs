# Portal de Conciliación · EkoFinance
# Sin dependencias: sólo biblioteca estándar de Python. La imagen se
# construye en segundos y no necesita red después del primer pull.
FROM python:3.12-slim

WORKDIR /portal
COPY app.py .

ENV PUERTO=8080 PYTHONUNBUFFERED=1
EXPOSE 8080

# El resto (config/, data/, archivos/, static/, logs/) se monta desde el
# disco del alumno: así plantar algo es editar un archivo, sin reconstruir.
CMD ["python", "app.py"]
