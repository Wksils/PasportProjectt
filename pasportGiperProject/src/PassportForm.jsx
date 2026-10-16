import React from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, Mail, FileText, Calendar, MapPin, CheckCircle } from 'lucide-react';

export default function PassportForm() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      gender: 'Мужской',
      has_foreign_passport: false
    }
  });

  const actualAddress = watch('actual_address');

  // Функция автозаполнения прописки, если она совпадает с фактическим адресом
  const handleSyncAddress = (e) => {
    if (e.target.checked) {
      setValue('registration_address', actualAddress || '');
    }
  };

const onSubmit = async (data) => {
  try {
    const response = await fetch('http://localhost:8000/api/save_passport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok) {
      alert(`Успех! Данные записаны в базу данных PostgreSQL. ID: ${result.message}`);
    } else {
      alert(`Ошибка сервера: ${result.detail}`);
    }
  } catch (error) {
    alert('Не удалось связаться с сервером. Убедитесь, что server.py запущен!');
  }
};


  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '25px' }}>Анкета личных и паспортных данных</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        
        {/* БЛОК 1: БАЗОВЫЕ КОНТАКТЫ (Таблица people) */}
        <fieldset style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', marginBottom: '25px', backgroundColor: '#fff' }}>
          <legend style={{ padding: '0 10px', fontWeight: 'bold', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <User size={18} /> 1. Личные и контактные данные
          </legend>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Фамилия *</label>
              <input {...register('last_name', { required: 'Обязательное поле' })} style={inputStyle} placeholder="Иванов" />
              {errors.last_name && <span style={errorStyle}>{errors.last_name.message}</span>}
            </div>

            <div>
              <label>Имя *</label>
              <input {...register('first_name', { required: 'Обязательное поле' })} style={inputStyle} placeholder="Иван" />
              {errors.first_name && <span style={errorStyle}>{errors.first_name.message}</span>}
            </div>

            <div>
              <label>Отчество</label>
              <input {...register('middle_name')} style={inputStyle} placeholder="Иванович" />
            </div>

            <div>
              <label>Пол *</label>
              <select {...register('gender')} style={inputStyle}>
                <option value="Мужской">Мужской</option>
                <option value="Женский">Женский</option>
              </select>
            </div>

            <div>
              <label><Calendar size={14} /> Дата рождения *</label>
              <input type="date" {...register('birth_date', { required: 'Обязательное поле' })} style={inputStyle} />
              {errors.birth_date && <span style={errorStyle}>{errors.birth_date.message}</span>}
            </div>

            <div>
              <label><Mail size={14} /> Email *</label>
              <input type="email" {...register('email', { required: 'Обязательное поле' })} style={inputStyle} placeholder="example@mail.ru" />
              {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
            </div>

            <div>
              <label><Phone size={14} /> Мобильный телефон *</label>
              <input {...register('mobile_phone', { required: 'Обязательное поле' })} style={inputStyle} placeholder="+7 (999) 123-45-67" />
              {errors.mobile_phone && <span style={errorStyle}>{errors.mobile_phone.message}</span>}
            </div>

            <div>
              <label><Phone size={14} /> Домашний телефон</label>
              <input {...register('home_phone')} style={inputStyle} placeholder="8 (495) 123-45-67" />
            </div>
          </div>
        </fieldset>

        {/* БЛОК 2: ПАСПОРТНЫЕ ДАННЫЕ (Таблица passports) */}
        <fieldset style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '20px', marginBottom: '25px', backgroundColor: '#fff' }}>
          <legend style={{ padding: '0 10px', fontWeight: 'bold', color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FileText size={18} /> 2. Паспортные данные РФ
          </legend>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label>Серия паспорта *</label>
              <input {...register('passport_series', { required: '4 цифры', pattern: { value: /^\d{4}$/, message: 'Формат: 4 цифры' } })} style={inputStyle} placeholder="45 12" maxLength={5} />
              {errors.passport_series && <span style={errorStyle}>{errors.passport_series.message}</span>}
            </div>

            <div>
              <label>Номер паспорта *</label>
              <input {...register('passport_number', { required: '6 цифр', pattern: { value: /^\d{6}$/, message: 'Формат: 6 цифр' } })} style={inputStyle} placeholder="123456" maxLength={6} />
              {errors.passport_number && <span style={errorStyle}>{errors.passport_number.message}</span>}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><MapPin size={14} /> Место рождения *</label>
            <input { ...register('birth_place', { required: 'Обязательное поле' }) } style={inputStyle} placeholder="Г. МОСКВА" />
            {errors.birth_place && <span style={errorStyle}>{errors.birth_place.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label>Дата выдачи *</label>
              <input type="date" { ...register('issue_date', { required: 'Обязательное поле' }) } style={inputStyle} />
              {errors.issue_date && <span style={errorStyle}>{errors.issue_date.message}</span>}
            </div>

            <div>
              <label>Код подразделения *</label>
              <input { ...register('department_code', { required: 'Формат 770-001', pattern: { value: /^\d{3}-\d{3}$/, message: 'Формат: 123-456' } }) } style={inputStyle} placeholder="770-001" maxLength={7} />
              {errors.department_code && <span style={errorStyle}>{errors.department_code.message}</span>}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Кем выдан *</label>
            <textarea { ...register('issued_by', { required: 'Обязательное поле' }) } style={{ ...inputStyle, height: '60px', resize: 'vertical' }} placeholder="ТП УФМС РОССИИ..." />
            {errors.issued_by && <span style={errorStyle}>{errors.issued_by.message}</span>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Фактический адрес проживания *</label>
            <input { ...register('actual_address', { required: 'Обязательное поле' }) } style={inputStyle} placeholder="г. Москва, ул. Ленина, д. 1, кв. 5" />
            {errors.actual_address && <span style={errorStyle}>{errors.actual_address.message}</span>}
          </div>

          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="syncAddress" onChange={handleSyncAddress} style={{ cursor: 'pointer' }} />
            <label htmlFor="syncAddress" style={{ cursor: 'pointer', fontSize: '14px', color: '#555' }}>Адрес регистрации совпадает с фактическим</label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Адрес регистрации (прописка) *</label>
            <input { ...register('registration_address', { required: 'Обязательное поле' }) } style={inputStyle} placeholder="г. Москва, ул. Ленина, д. 1, кв. 5" />
            {errors.registration_address && <span style={errorStyle}>{errors.registration_address.message}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <input type="checkbox" id="foreignPass" { ...register('has_foreign_passport') } style={{ cursor: 'pointer' }} />
            <label htmlFor="foreignPass" style={{ cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Имею действующий загранпаспорт</label>
          </div>
        </fieldset>

        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
          <CheckCircle size={18} /> Сохранить анкету
        </button>
      </form>
    </div>
  );
}

// Простые встроенные стили, чтобы не подключать лишний CSS
const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  marginTop: '5px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  boxSizing: 'border-box',
  fontSize: '14px'
};

const errorStyle = {
  color: '#EF4444',
  fontSize: '12px',
  marginTop: '3px',
  display: 'block'
};
