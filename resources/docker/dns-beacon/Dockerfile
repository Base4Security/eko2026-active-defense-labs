FROM python:3.12-alpine
WORKDIR /app
COPY beacon.py .
EXPOSE 5353/udp
CMD ["python", "-u", "beacon.py"]
