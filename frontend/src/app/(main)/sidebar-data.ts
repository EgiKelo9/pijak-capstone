export const DATA = {
  user: {
    name: 'Jahn Da',
    email: 'jahndamooda@example.com',
    avatar: '/images/avatar-jahn.jpg',
  },
  navMain: [
    {
      title: 'Dasbor',
      url: '/dasbor',
      icon: '/icons8/icons8-doughnut-chart-100.png',
      isActive: true,
      items: [
        { title: 'Forecasting', url: '/dasbor/forecasting' },
        { title: 'Clustering', url: '/dasbor/clustering' },
      ],
    },
    {
      title: 'Analisis',
      url: '/dashboard',
      icon: '/icons8/icons8-area-chart-100.png',
      isActive: false,
    },
    {
      title: 'Riwayat Analisis',
      url: '/riwayat',
      icon: '/icons8/icons8-timeline-100.png',
      isActive: false,
    },
  ],
};