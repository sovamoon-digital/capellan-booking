'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ServiceCard from './ServiceCard';
import Calendar from './Calendar';
import TimeSlots from './TimeSlots';
import CustomerForm, { CustomerData } from './CustomerForm';
import ConfirmStep from './ConfirmStep';

interface Service { id: string; name: string; duration_hours: number; price: number; icon: string; }
interface AvailDay { day_of_week: string; is_open: boolean; open_time: string; close_time: string; }

const STEPS = ['Servicio', 'Fecha y Hora', 'Tus Datos', 'Confirmar'];

const emptyCustomer: CustomerData = { name: '', phone: '', email: '', car_make: '', car_model: '', car_year: '', notes: '' };

interface Props { initialService?: Service; onClose?: () => void; }

export default function BookingWizard({ initialService, onClose }: Props) {
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailDay[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [customer, setCustomer] = useState<CustomerData>(emptyCustomer);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices);
    fetch('/api/availability').then(r => r.json()).then(setAvailability);
    fetch('/api/blocked-dates').then(r => r.json()).then(setBlockedDates);
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    fetch(`/api/slots?date=${format(selectedDate, 'yyyy-MM-dd')}&duration=${selectedService.duration_hours}`)
      .then(r => r.json())
      .then(data => { setSlots(data); setSlotsLoading(false); });
  }, [selectedDate, selectedService]);

  const canNext = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedDate && !!selectedTime;
    if (step === 2) return !!(customer.name.trim() && customer.phone.trim());
    return true;
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          service_name: selectedService.name,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          duration_hours: selectedService.duration_hours,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          car_make: customer.car_make,
          car_model: customer.car_model,
          car_year: customer.car_year,
          notes: customer.notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Booking failed');
      const data = await res.json();
      setBookingData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Algo salió mal. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setBookingData(null);
    setStep(0);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomer(emptyCustomer);
    setError('');
  };

  if (bookingData) {
    const ref = String(bookingData.id).slice(-6).toUpperCase();
    return (
      <div className="text-center py-8 px-4">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-3xl font-bold text-[#D4A017] mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.04em' }}>
          ¡CITA CONFIRMADA!
        </h2>

        <div className="inline-flex items-center gap-2 bg-white/5 border border-[#D4A017]/30 rounded-full px-5 py-2 mt-2 mb-6">
          <span className="text-white/40 text-xs uppercase tracking-wider">Referencia</span>
          <span className="text-[#D4A017] font-bold tracking-widest font-mono text-lg">#{ref}</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{selectedService?.icon}</span>
            <div>
              <p className="text-white font-semibold">{selectedService?.name}</p>
              <p className="text-white/40 text-xs">{selectedService?.duration_hours}h · ${selectedService?.price}</p>
            </div>
          </div>
          <div className="h-px bg-white/10 mb-4" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Fecha</p>
              <p className="text-white font-medium capitalize">
                {selectedDate && format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Hora</p>
              <p className="text-white font-medium">{selectedTime}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-white font-medium">{customer.name}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Teléfono</p>
              <p className="text-white font-medium">{customer.phone}</p>
            </div>
            {(customer.car_make || customer.car_model) && (
              <div className="col-span-2">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Vehículo</p>
                <p className="text-white font-medium">{[customer.car_year, customer.car_make, customer.car_model].filter(Boolean).join(' ')}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-white/40 text-xs mb-1">📱 Confirmación enviada por WhatsApp</p>
        <p className="text-white/25 text-xs mb-8">Guarda tu número de referencia para cambios o cancelaciones</p>

        <button onClick={onClose ?? resetWizard}
          className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors">
          Reservar Otra Cita
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              i < step ? 'bg-[#D4A017] text-black' : i === step ? 'bg-[#D4A017] text-black ring-2 ring-[#D4A017]/30' : 'bg-white/10 text-white/30'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block transition-colors ${i === step ? 'text-[#D4A017] font-semibold' : 'text-white/30'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-[#D4A017]' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>ELIGE UN SERVICIO</h2>
            <div className="grid grid-cols-2 gap-3">
              {services.map(s => (
                <ServiceCard key={s.id} service={s} selected={selectedService?.id === s.id}
                  onSelect={svc => setSelectedService(svc)} />
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>ELIGE UNA FECHA</h2>
              <Calendar
                availability={availability}
                selected={selectedDate}
                onSelect={d => { setSelectedDate(d); setSelectedTime(null); }}
                blockedDates={blockedDates}
                duration={selectedService?.duration_hours}
              />
            </div>
            {selectedDate && (
              <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Horarios Disponibles</h3>
                <TimeSlots slots={slots} selected={selectedTime} onSelect={setSelectedTime} loading={slotsLoading} />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>TUS DATOS</h2>
            <CustomerForm data={customer} onChange={setCustomer} />
          </div>
        )}

        {step === 3 && selectedService && selectedDate && selectedTime && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em' }}>CONFIRMAR CITA</h2>
            {error && <div className="mb-4 p-3 rounded-lg bg-[#C0200F]/20 border border-[#C0200F]/40 text-[#FCA5A5] text-sm">{error}</div>}
            <ConfirmStep service={selectedService} date={selectedDate} time={selectedTime}
              customer={customer} onConfirm={handleConfirm} loading={submitting} />
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {step < 3 && (
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(s => s - 1)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${step === 0 ? 'invisible' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            ← Atrás
          </button>
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-[#D4A017] hover:bg-[#F0C040] text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
          >
            SIGUIENTE →
          </button>
        </div>
      )}
    </div>
  );
}
