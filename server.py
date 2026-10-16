import os
import json
import psycopg2
from http.server import HTTPServer, BaseHTTPRequestHandler

if "PGAPPNAME" in os.environ:
    del os.environ["PGAPPNAME"]

DSN = "dbname=company_db user=my_user password=my_password host=localhost port=5433 client_encoding=UTF8 options='-c client_encoding=UTF8'"

class PassportAPIHandler(BaseHTTPRequestHandler):
    # Настраиваем CORS заголовки, чтобы React мог слать запросы
    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    # Обработка предварительных запросов браузера (CORS Preflight)
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    # Принимаем данные от формы React
    def do_POST(self):
        if self.path == "/api/save_passport":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))

            conn = None
            cursor = None
            try:
                conn = psycopg2.connect(DSN)
                cursor = conn.cursor()

                # 1. Запись в people
                cursor.execute('''
                INSERT INTO people (last_name, first_name, middle_name, mobile_phone, home_phone, birth_date, gender, email)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
                ''', (
                    data.get("last_name"), data.get("first_name"), data.get("middle_name"),
                    data.get("mobile_phone"), data.get("home_phone"), data.get("birth_date"),
                    data.get("gender"), data.get("email")
                ))
                person_id = cursor.fetchone()[0]

                # 2. Запись в passports
                cursor.execute('''
                INSERT INTO passports (
                    person_id, passport_series, passport_number, last_name, first_name, middle_name, 
                    birth_date, birth_place, issue_date, department_code, issued_by, 
                    registration_address, actual_address, has_foreign_passport
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                ''', (
                    person_id, data.get("passport_series"), data.get("passport_number"),
                    data.get("last_name"), data.get("first_name"), data.get("middle_name"),
                    data.get("birth_date"), data.get("birth_place"), data.get("issue_date"),
                    data.get("department_code"), data.get("issued_by"),
                    data.get("registration_address"), data.get("actual_address"),
                    data.get("has_foreign_passport")
                ))

                conn.commit()

                # Отправляем успешный ответ
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._set_cors_headers()
                self.end_headers()
                response = {"status": "success", "message": f"ID: {person_id}"}
                self.wfile.write(json.dumps(response).encode("utf-8"))

            except psycopg2.errors.UniqueViolation:
                if conn: conn.rollback()
                self._send_error_response(400, "Пользователь с таким Email уже существует!")
            except Exception as e:
                if conn: conn.rollback()
                self._send_error_response(500, f"Ошибка базы данных: {str(e)}")
            finally:
                if cursor: cursor.close()
                if conn: conn.close()
        else:
            self.send_error(404, "Not Found")

    def _send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self._set_cors_headers()
        self.end_headers()
        response = {"detail": message}
        self.wfile.write(json.dumps(response).encode("utf-8"))

def run(server_class=HTTPServer, handler_class=PassportAPIHandler, port=8000):
    server_address = ("localhost", port) 
    httpd = server_class(server_address, handler_class)
    print(f"Сервер запущен на http://localhost:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
