import psycopg2
import random
import os
from datetime import datetime, timedelta
from faker import Faker

if "PGAPPNAME" in os.environ:
    del os.environ["PGAPPNAME"]

dsn = "dbname=company_db user=my_user password=my_password host=localhost port=5433 client_encoding=UTF8 options='-c client_encoding=UTF8'"

fake = Faker('ru_RU')

conn = None
cursor = None

try:
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()

    print("Очистка старых таблиц...")
    cursor.execute("DROP TABLE IF EXISTS passports CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS people CASCADE;")
    conn.commit()

    cursor.execute('''
    CREATE TABLE people (
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
    CREATE TABLE passports (
        person_id INTEGER PRIMARY KEY REFERENCES people (id) ON DELETE CASCADE,
        passport_series VARCHAR(10) NOT NULL,
        passport_number VARCHAR(10) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        birth_date DATE NOT NULL,
        birth_place TEXT NOT NULL,         -- Место рождения перенесено сюда
        issue_date DATE NOT NULL,
        department_code VARCHAR(10) NOT NULL,
        issued_by TEXT NOT NULL,
        registration_address TEXT NOT NULL,
        actual_address TEXT NOT NULL,
        has_foreign_passport BOOLEAN DEFAULT FALSE
    );
    ''')
    conn.commit()

    people_rows = []
    passport_data_temporary = []

    print("Генерация 1000 реалистичных анкет...")
    for _ in range(1000):
        gender = random.choice(['Мужской', 'Женский'])
        if gender == 'Мужской':
            first_name = fake.first_name_male()
            last_name = fake.last_name_male()
            middle_name = fake.middle_name_male()
        else:
            first_name = fake.first_name_female()
            last_name = fake.last_name_female()
            middle_name = fake.middle_name_female()
            
        mobile_phone = fake.phone_number()
        home_phone = f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10, 99)}" if random.random() < 0.60 else None
        email = fake.unique.email()
        birth_date = fake.date_of_birth(minimum_age=18, maximum_age=70)
        
        current_year = datetime.now().year
        age = current_year - birth_date.year
        if age >= 45:
            last_required_age = 45
        elif age >= 20:
            last_required_age = 20
        else:
            last_required_age = 14
            
        try:
            passport_milestone_date = birth_date.replace(year=birth_date.year + last_required_age)
        except ValueError:
            passport_milestone_date = birth_date.replace(year=birth_date.year + last_required_age, month=3, day=1)
        
        days_offset = random.randint(1, 60)
        issue_date = passport_milestone_date + timedelta(days=days_offset)
        if issue_date > datetime.now().date():
            issue_date = datetime.now().date()

        passport_series = f"{random.randint(10, 99)} {random.randint(10, 99)}"
        passport_number = f"{random.randint(100000, 999999)}"
        department_code = f"{random.randint(100, 999)}-{random.randint(100, 999)}"
        issued_by = f"УФМС РОССИИ ПО {fake.region().upper()}"
        birth_place = f"Г. {fake.city().upper()}, {fake.region().upper()}"
        
        actual_address = fake.address().replace("\n", ", ")
        registration_address = actual_address if random.random() < 0.70 else fake.address().replace("\n", ", ")
        has_foreign_passport = random.choice([True, False])
        
        people_rows.append((last_name, first_name, middle_name, mobile_phone, home_phone, birth_date, gender, email))
        
        passport_data_temporary.append((
            passport_series, passport_number, last_name, first_name, middle_name, 
            birth_date, birth_place, issue_date, department_code, issued_by, 
            registration_address, actual_address, has_foreign_passport
        ))

    print("Сохранение базовых анкет (people)...")
    inserted_ids = []
    for row in people_rows:
        cursor.execute('''
        INSERT INTO people (last_name, first_name, middle_name, mobile_phone, home_phone, birth_date, gender, email)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
        ''', row)
        inserted_ids.append(cursor.fetchone()[0]) 

    print("Сохранение паспортных данных (passports)...")
    for person_id, pass_data in zip(inserted_ids, passport_data_temporary):
        cursor.execute('''
        INSERT INTO passports (
            person_id, passport_series, passport_number, last_name, first_name, middle_name, 
            birth_date, birth_place, issue_date, department_code, issued_by, 
            registration_address, actual_address, has_foreign_passport
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        ''', (person_id, *pass_data))

    conn.commit()
    print(f"\nГотово! Структура обновлена. В базу успешно записано 1000 связанных строк.")

except Exception as error:
    print(f"\nПроизошла ошибка: {error}")
    if conn is not None: 
        conn.rollback()

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
