export const fridgeTemperatureSeries = {
  vaccine: {
    id: 'vaccine',
    name: 'Vaccine fridge',
    location: 'Treatment room',
    target: '2–8°C',
    colour: '#2563eb',
    data: [
      { hour: '00:00', temp: 4.4 }, { hour: '01:00', temp: 4.3 },
      { hour: '02:00', temp: 4.2 }, { hour: '03:00', temp: 4.1 },
      { hour: '04:00', temp: 4.2 }, { hour: '05:00', temp: 4.5 },
      { hour: '06:00', temp: 4.9 }, { hour: '07:00', temp: 5.3 },
      { hour: '08:00', temp: 5.7 }, { hour: '09:00', temp: 5.9 },
      { hour: '10:00', temp: 6.1 }, { hour: '11:00', temp: 5.8 },
      { hour: '12:00', temp: 5.5 }, { hour: '13:00', temp: 5.3 },
      { hour: '14:00', temp: 5.1 }, { hour: '15:00', temp: 4.9 },
      { hour: '16:00', temp: 4.7 }, { hour: '17:00', temp: 4.6 },
      { hour: '18:00', temp: 4.4 }, { hour: '19:00', temp: 4.3 },
      { hour: '20:00', temp: 4.2 }, { hour: '21:00', temp: 4.2 },
      { hour: '22:00', temp: 4.3 }, { hour: '23:00', temp: 4.4 },
    ],
  },
  dispensary: {
    id: 'dispensary',
    name: 'Dispensary fridge',
    location: 'Dispensary',
    target: '2–8°C',
    colour: '#06b6d4',
    data: [
      { hour: '00:00', temp: 5.1 }, { hour: '01:00', temp: 5.0 },
      { hour: '02:00', temp: 4.9 }, { hour: '03:00', temp: 4.8 },
      { hour: '04:00', temp: 4.8 }, { hour: '05:00', temp: 4.9 },
      { hour: '06:00', temp: 5.2 }, { hour: '07:00', temp: 5.8 },
      { hour: '08:00', temp: 6.4 }, { hour: '09:00', temp: 6.8 },
      { hour: '10:00', temp: 7.1 }, { hour: '11:00', temp: 6.7 },
      { hour: '12:00', temp: 6.2 }, { hour: '13:00', temp: 5.8 },
      { hour: '14:00', temp: 5.6 }, { hour: '15:00', temp: 5.4 },
      { hour: '16:00', temp: 5.2 }, { hour: '17:00', temp: 5.0 },
      { hour: '18:00', temp: 4.9 }, { hour: '19:00', temp: 4.8 },
      { hour: '20:00', temp: 4.8 }, { hour: '21:00', temp: 4.9 },
      { hour: '22:00', temp: 5.0 }, { hour: '23:00', temp: 5.1 },
    ],
  },
};

export function getFridgeStats(series) {
  const values = series.data.map((point) => point.temp);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const current = values[values.length - 1];
  const excursions = values.filter((value) => value < 2 || value > 8).length;
  const status = excursions > 0 ? 'Excursion' : 'In range';

  return {
    min,
    max,
    current,
    excursions,
    status,
  };
}
