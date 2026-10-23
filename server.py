import os
import json
import psycopg2
from http.server import HTTPServer, BaseHTTPRequestHandler

if "PGAPPNAME" in os.environ:
    del os.environ["PGAPPNAME"]

DSN = "dbname=company_db user=my_user password=my_password host=localhost port=5433 client_encoding=UTF8 options='-c client_encoding=UTF8'"

class PassportAPIHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

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

                # 1. Всегда создаем таблицы с учетом того, что паспорта может не быть
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS people (
                    id SERIAL PRIMARY KEY,
                    last_name VARCHAR(100) NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    middle_name VARCHAR(100),
                    mobile_phone VARCHAR(50),
                    home_phone VARCHAR(50),
                    birth_date DATE NOT NULL,
                    gender VARCHAR(10),
                    email VARCHAR(150) UNIQUE
                );
                ''')

                cursor.execute('''
                CREATE TABLE IF NOT EXISTS passports (
                    person_id INTEGER PRIMARY KEY REFERENCES people (id) ON DELETE CASCADE,
                    passport_series VARCHAR(10),
                    passport_number VARCHAR(10),
                    last_name VARCHAR(100),
                    first_name VARCHAR(100),
                    middle_name VARCHAR(100),
                    birth_date DATE,
                    birth_place TEXT,
                    issue_date DATE,
                    department_code VARCHAR(10),
                    issued_by TEXT,
                    registration_address TEXT,
                    actual_address TEXT,
                    has_foreign_passport BOOLEAN DEFAULT FALSE
                );
                ''')

                # 2. Запись в первую таблицу (Личные данные) - ОБЯЗАТЕЛЬНО
                cursor.execute('''
                INSERT INTO people (last_name, first_name, middle_name, mobile_phone, home_phone, birth_date, gender, email)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
                ''', (
                    data.get("last_name"), data.get("first_name"), data.get("middle_name"),
                    data.get("mobile_phone"), data.get("home_phone"), data.get("birth_date"),
                    data.get("gender"), data.get("email")
                ))
                person_id = cursor.fetchone()[0]

                # Проверяем, заполнил ли пользователь вторую (паспортную) часть формы
                # Если введена серия или номер, считаем, что паспорт заполняется
                has_passport_data = bool(data.get("passport_series") or data.get("passport_number"))

                if has_passport_data:
                    # Валидация на стороне бэкенда для безопасности
                    if not all([data.get("passport_series"), data.get("passport_number"), data.get("birth_place"), data.get("issue_date")]):
                        raise Exception("Заполнены не все обязательные поля паспортных данных!")

                    # 3. Запись во вторую таблицу (Паспортные данные)
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
                        data.get("has_foreign_passport", False)
                    ))
                    msg = f"Заявка создана успешно с паспортными данными! ID человека: {person_id}"
                else:
                    msg = f"Заявка создана без паспортных данных (только контакты). ID человека: {person_id}"

                conn.commit()

                # Успешный ответ
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._set_cors_headers()
                self.end_headers()
                response = {"status": "success", "message": msg}
                self.wfile.write(json.dumps(response).encode("utf-8"))

            except psycopg2.errors.UniqueViolation:
                if conn: conn.rollback()
                self._send_error_response(400, "Пользователь с таким Email уже существует!")
            except Exception as e:
                if conn: conn.rollback()
                self._send_error_response(500, f"Ошибка сервера: {str(e)}")
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
    server_address = ("0.0.0.0", port)
    httpd = server_class(server_address, handler_class)
    print(f"Сервер запущен на http://localhost:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()



# SELECT 
#     p.id as person_id, 
#     p.last_name, p.middle_name, p.birth_date,
#     p.mobile_phone, p.email, p.gender, 
#     pass.passport_series, pass.passport_number, pass.actual_address, pass.birth_place 
# FROM people p
# LEFT JOIN passports pass ON p.id = pass.person_id
# WHERE p.first_name = 'Иван' 
#   AND p.birth_date = '1990-10-10';
