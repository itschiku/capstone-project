FROM python:3.11-slim
WORKDIR /app
RUN pip install django djangorestframework django-cors-headers pymysql
COPY . .
EXPOSE 8080
CMD ["python", "manage.py", "runserver", "0.0.0.0:8080"]
