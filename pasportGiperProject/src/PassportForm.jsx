import React from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, Mail, FileText, Calendar, MapPin, CheckCircle } from 'lucide-react';

export default function PassportForm() {
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      gender: 'Мужской',
      has_foreign_passport: false,
      passport_series: '',
      passport_number: '',
      birth_place: '',
      issue_date: '',
      department_code: '',
      issued_by: '',
      actual_address: '',
      registration_address: ''
    }
  });

  // Отслеживаем значения всех полей из паспортной секции
  const passportSeries = watch('passport_series');
  const passportNumber = watch('passport_number');
  const birthPlace = watch('birth_place');
  const issueDate = watch('issue_date');
  const departmentCode = watch('department_code');
  const issuedBy = watch('issued_by');
  const actualAddress = watch('actual_address');
  const registrationAddress = watch('registration_address');

  // Определяем, начал ли пользователь заполнять вторую часть формы
  const isPassportPartStarted = Boolean(
    (passportSeries && passportSeries.trim() !== '') ||
    (passportNumber && passportNumber.trim() !== '') ||
    (birthPlace && birthPlace.trim() !== '') ||
    (issueDate && issueDate.trim() !== '') ||
    (departmentCode && departmentCode.trim() !== '') ||
    (issuedBy && issuedBy.trim() !== '') ||
    (actualAddress && actualAddress.trim() !== '') ||
    (registrationAddress && registrationAddress.trim() !== '')
  );

  // Копирование фактического адреса в адрес прописки
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
        alert(result.message);
      } else {
        alert(`Ошибка сервера: ${result.detail}`);
      }
    } catch (error) {
      alert('Не удалось связаться с сервером. Убедитесь, что server.py запущен!');
    }
  };


  return (
        <div style={containerStyle}>
      <h2 style={titleStyle}>Анкета личных данных</h2>
      <p style={subtitleStyle}>
        Вы можете заполнить только первый блок. Если вы начнете заполнять паспортные данные, все поля со звездочкой (*) станут обязательными.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        
        {/* БЛОК 1: Контактные данные */}
        <fieldset style={fieldsetStyle}>
          <legend style={{ ...legendStyle, color: '#4F46E5' }}>
            <User size={18} /> 1. Личные и контактные данные (Обязательно)
          </legend>
          
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Фамилия *</label>
              <input {...register('last_name', { required: 'Введите фамилию' })} style={inputStyle} placeholder="Иванов" />
              {errors.last_name && <span style={errorStyle}>{errors.last_name.message}</span>}
            </div>

            <div>
              <label style={labelStyle}>Имя *</label>
              <input {...register('first_name', { required: 'Введите имя' })} style={inputStyle} placeholder="Иван" />
              {errors.first_name && <span style={errorStyle}>{errors.first_name.message}</span>}
            </div>

            <div>
              <label style={labelStyle}>Отчество</label>
              <input {...register('middle_name')} style={inputStyle} placeholder="Иванович" />
            </div>

            <div>
              <label style={labelStyle}>Пол *</label>
              <select {...register('gender')} style={inputStyle}>
                <option value="Мужской">Мужской</option>
                <option value="Женский">Женский</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}><Calendar size={14} /> Дата рождения *</label>
              <input type="date" {...register('birth_date', { required: 'Укажите дату рождения' })} style={inputStyle} />
              {errors.birth_date && <span style={errorStyle}>{errors.birth_date.message}</span>}
            </div>

            <div>
              <label style={labelStyle}><Mail size={14} /> Email *</label>
              <input type="email" {...register('email', { required: 'Введите Email' })} style={inputStyle} placeholder="example@mail.ru" />
              {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
            </div>

            <div>
              <label style={labelStyle}><Phone size={14} /> Мобильный телефон *</label>
              <input {...register('mobile_phone', { required: 'Введите номер телефона' })} style={inputStyle} placeholder="+7 (999) 123-45-67" />
              {errors.mobile_phone && <span style={errorStyle}>{errors.mobile_phone.message}</span>}
            </div>

            <div>
              <label style={labelStyle}><Phone size={14} /> Домашний телефон</label>
              <input {...register('home_phone')} style={inputStyle} placeholder="8 (495) 123-45-67" />
            </div>
          </div>
        </fieldset>

        {/* БЛОК 2: Паспортные данные (Условная валидация) */}
        <fieldset style={{ 
          ...fieldsetStyle, 
          border: isPassportPartStarted ? '1px solid #10B981' : '1px solid #ddd', 
          backgroundColor: isPassportPartStarted ? '#F0FDF4' : '#fff',
          transition: 'all 0.3s ease'
        }}>
          <legend style={{ ...legendStyle, color: isPassportPartStarted ? '#10B981' : '#666' }}>
            <FileText size={18} /> 2. Паспортные данные РФ {isPassportPartStarted ? '(Заполняется *)' : '(Необязательно)'}
          </legend>

          <div style={{ ...gridStyle, marginBottom: '15px' }}>
            <div>
              <label style={labelStyle}>Серия паспорта {isPassportPartStarted && '*'}</label>
              <input 
                {...register('passport_series', { 
                  required: isPassportPartStarted ? 'Укажите серию' : false, 
                  pattern: isPassportPartStarted ? { value: /^\d{4}$/, message: 'Должно быть 4 цифры' } : null 
                })} 
                style={inputStyle} placeholder="4512" maxLength={4} 
              />
              {errors.passport_series && <span style={errorStyle}>{errors.passport_series.message}</span>}
            </div>

            <div>
              <label style={labelStyle}>Номер паспорта {isPassportPartStarted && '*'}</label>
              <input 
                {...register('passport_number', { 
                  required: isPassportPartStarted ? 'Укажите номер' : false, 
                  pattern: isPassportPartStarted ? { value: /^\d{6}$/, message: 'Должно быть 6 цифр' } : null 
                })} 
                style={inputStyle} placeholder="123456" maxLength={6} 
              />
              {errors.passport_number && <span style={errorStyle}>{errors.passport_number.message}</span>}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}><MapPin size={14} /> Место рождения {isPassportPartStarted && '*'}</label>
            <input 
              {...register('birth_place', { required: isPassportPartStarted ? 'Укажите место рождения' : false })} 
              style={inputStyle} placeholder="Г. МОСКВА" 
            />
            {errors.birth_place && <span style={errorStyle}>{errors.birth_place.message}</span>}
          </div>

          <div style={{ ...gridStyle, marginBottom: '15px' }}>
            <div>
              <label style={labelStyle}>Дата выдачи {isPassportPartStarted && '*'}</label>
              <input 
                type="date" 
                {...register('issue_date', { required: isPassportPartStarted ? 'Укажите дату выдачи' : false })} 
                style={inputStyle} 
              />
              {errors.issue_date && <span style={errorStyle}>{errors.issue_date.message}</span>}
            </div>

            <div>
              <label style={labelStyle}>Код подразделения {isPassportPartStarted && '*'}</label>
              <input 
                {...register('department_code', { 
                  required: isPassportPartStarted ? 'Укажите код' : false, 
                  pattern: isPassportPartStarted ? { value: /^\d{3}-\d{3}$/, message: 'Формат: 123-456' } : null 
                })} 
                style={inputStyle} placeholder="770-001" maxLength={7} 
              />
              {errors.department_code && <span style={errorStyle}>{errors.department_code.message}</span>}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Кем выдан {isPassportPartStarted && '*'}</label>
            <textarea 
              {...register('issued_by', { required: isPassportPartStarted ? 'Укажите, кем выдан паспорт' : false })} 
              style={{ ...inputStyle, height: '60px', resize: 'vertical' }} 
              placeholder="ТП УФМС РОССИИ ПО ГОР. МОСКВЕ" 
            />
            {errors.issued_by && <span style={errorStyle}>{errors.issued_by.message}</span>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Фактический адрес проживания {isPassportPartStarted && '*'}</label>
            <input 
              {...register('actual_address', { required: isPassportPartStarted ? 'Укажите фактический адрес' : false })} 
              style={inputStyle} placeholder="г. Москва, ул. Ленина, д. 1, кв. 5" 
            />
            {errors.actual_address && <span style={errorStyle}>{errors.actual_address.message}</span>}
          </div>

          <div style={checkboxWrapperStyle}>
            <input type="checkbox" id="syncAddress" onChange={handleSyncAddress} style={{ cursor: 'pointer' }} />
            <label htmlFor="syncAddress" style={checkboxLabelStyle}>Адрес регистрации совпадает с фактическим</label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Адрес регистрации (прописка) {isPassportPartStarted && '*'}</label>
            <input 
              {...register('registration_address', { required: isPassportPartStarted ? 'Укажите адрес регистрации' : false })} 
              style={inputStyle} placeholder="г. Москва, ул. Ленина, д. 1, кв. 5" 
            />
            {errors.registration_address && <span style={errorStyle}>{errors.registration_address.message}</span>}
          </div>

          <div style={{ ...checkboxWrapperStyle, marginTop: '10px' }}>
            <input type="checkbox" id="foreignPass" {...register('has_foreign_passport')} style={{ cursor: 'pointer' }} />
            <label htmlFor="foreignPass" style={{ ...checkboxLabelStyle, fontWeight: 'bold' }}>Имею действующий загранпаспорт</label>
          </div>
        </fieldset>

        {/* Кнопка отправки */}
        <button type="submit" style={buttonStyle}>
          <CheckCircle size={18} /> Сохранить анкету
        </button>
      </form>
    </div>
  );
}

const containerStyle = { maxWidth: '800px', margin: '30px auto', padding: '25px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const titleStyle = { textAlign: 'center', color: '#111827', marginBottom: '4px', fontSize: '24px', fontWeight: '700' };
const subtitleStyle = { textAlign: 'center', color: '#6B7280', marginBottom: '25px', fontSize: '14px', lineHeight: '1.5' };
const fieldsetStyle = { border: '1px solid #E5E7EB', borderRadius: '6px', padding: '20px', marginBottom: '25px', backgroundColor: '#fff' };
const legendStyle = { padding: '0 10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', color: '#111827' };
const errorStyle = { color: '#DC2626', fontSize: '12px', marginTop: '4px', display: 'block' };
const checkboxWrapperStyle = { marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' };
const checkboxLabelStyle = { cursor: 'pointer', fontSize: '13px', color: '#4B5563', userSelect: 'none' };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' };

