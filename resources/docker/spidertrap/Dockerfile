# Spider trap — laberinto de enlaces para degradar crawlers y escáneres.
# Basado en la idea de adhdproject/spidertrap, reimplementado acá para no
# depender de un repositorio externo al armar el kit offline.
FROM python:3.12-alpine
WORKDIR /app
COPY trap.py .
EXPOSE 8000
CMD ["python", "-u", "trap.py"]
