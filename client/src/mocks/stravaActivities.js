/**
 * Données mockées pour les activités Strava
 */

const mockStravaActivities = [
  {
    id: 'strava-1',
    name: 'Sortie matinale autour de Strasbourg',
    type: 'Ride',
    distance: 32500, // mètres
    moving_time: 5400, // secondes
    total_elevation_gain: 320,
    start_date: '2025-04-01T07:30:00Z',
    start_latlng: [48.573405, 7.752111],
    end_latlng: [48.573405, 7.752111],
    map: {
      polyline: 'klmiGwhgcAhDwEmDtC{EpFcCzByErGsB~CmDnGmEjKeLhPgF|EeJvFiJpGsIbJkHpKeFhKoDpJwCzJcDrKwC|KeB|KaBpKeB~KeBlKyArK{ArKyAnKwAnKuAnKsAnKqAnKqAlKoAlKmAlKkAlKiAlKgAlKeAjKcAjKaAjK_AjK}@jK{@jKy@jKw@jKu@jKs@jKq@jKo@jKm@jKk@jKi@jKg@jKe@jKe@hKc@hKa@hK_@hK]hK[hKYhKWhKUhKShKQhKOhKMhKKhKIhKGhKEhKChK?hKAhK?hK@hKBhKDhKFhKHhKJhKLhKNhKPhKRhKThKVhKXhKZhK\\hK^hK`@hKb@hKd@hKf@hKh@hKj@hKl@hKn@hKp@hKr@hKt@hKv@hKx@hKz@hK|@hK~@hK`AhKbAhKdAhKfAhKhAhKjAhKlAhKnAhKpAhKrAhKtAhKvAhKxAhKzAhK|AhK~AhK`BhKbBhKdBhKfBhKhBhKjBhKlBhKnBhKpBhKrBhKtBhKvBhKxBhKzBhK|BhK~BhK`ChKbChKdChKfChKhChKjChKlChKnChKpChK'
    },
    average_speed: 6.02, // m/s
    max_speed: 12.8, // m/s
    average_heartrate: 145,
    max_heartrate: 175,
    device_name: 'Garmin Edge 830',
    athlete: {
      id: 12345678,
      firstname: 'Jean',
      lastname: 'Dupont'
    }
  },
  {
    id: 'strava-2',
    name: 'Sortie longue Strasbourg - Colmar',
    type: 'Ride',
    distance: 78200,
    moving_time: 12600,
    total_elevation_gain: 720,
    start_date: '2025-03-28T09:00:00Z',
    start_latlng: [48.573405, 7.752111],
    end_latlng: [48.080018, 7.358512],
    map: {
      polyline: 'klmiGwhgcAjH{JdGeKlGgLnGkMpGoMrGoMtGoMtGoMtGqMvGqMxGqMzGqM|GqM~GqM`HqMbHqMdHqMfHqMhHqMjHqMlHqMnHqMpHqMrHqMtHqMvHqMxHqMzHqM|HqM~HqM`IqMbIqMdIqMfIqMhIqMjIqMlIqMnIqMpIqMrIqMtIqMvIqMxIqMzIqM|IqM~IqM`JqMbJqMdJqMfJqMhJqMjJqMlJqMnJqMpJqMrJqMtJqMvJqMxJqMzJqM|JqM~JqM`KqMbKqMdKqMfKqMhKqMjKqMlKqMnKqMpKqMrKqMtKqMvKqMxKqMzKqM|KqM~KqM`LqMbLqMdLqMfLqMhLqMjLqMlLqMnLqMpLqMrLqMtLqMvLqMxLqMzLqM|LqM~LqM`MqMbMqMdMqMfMqMhMqMjMqMlMqMnMqMpMqMrMqMtMqMvMqMxMqMzMqM|MqM~MqM`NqMbNqMdNqMfNqMhNqMjNqMlNqMnNqMpNqMrNqMtNqMvNqMxNqMzNqM|NqM~NqM`OqMbOqMdOqMfOqMhOqMjOqMlOqMnOqMpOqMrOqMtOqMvOqMxOqMzOqM|OqM~OqM`PqMbPqMdPqMfPqMhPqMjPqMlPqMnPqMpPqMrPqMtPqMvPqMxPqMzPqM|PqM~PqM`QqMbQqMdQqMfQqMhQqMjQqMlQqMnQqMpQqMrQqMtQqMvQqMxQqMzQqM|QqM~QqM`RqMbRqMdRqMfRqMhRqMjRqMlRqMnRqMpRqMrRqMtRqMvRqMxRqMzRqM|RqM~RqM`SqMbSqMdSqMfSqMhSqMjSqMlSqMnSqMpSqMrSqMtSqMvSqMxSqMzSqM|SqM~SqM`TqMbTqMdTqMfTqMhTqMjTqMlTqMnTqMpTqMrTqMtTqMvTqMxTqMzTqM|TqM~TqM`UqMbUqMdUqMfUqMhUqMjUqMlUqMnUqMpUqMrUqMtUqMvUqMxUqMzUqM|UqM~UqM`VqMbVqMdVqMfVqMhVqM'
    },
    average_speed: 6.21, // m/s
    max_speed: 15.3, // m/s
    average_heartrate: 152,
    max_heartrate: 182,
    device_name: 'Garmin Edge 830',
    athlete: {
      id: 12345678,
      firstname: 'Jean',
      lastname: 'Dupont'
    }
  },
  {
    id: 'strava-3',
    name: 'Ascension du Ballon d\'Alsace',
    type: 'Ride',
    distance: 45300,
    moving_time: 7800,
    total_elevation_gain: 1250,
    start_date: '2025-03-20T10:15:00Z',
    start_latlng: [47.747247, 6.861789],
    end_latlng: [47.747247, 6.861789],
    map: {
      polyline: 'a`riG{`ecAqGeKsGkLuGmLwGoLyGqL{GsL}GuL_HwLaHyLcH{LeH}LgH_MiHaMkHcMmHeMoHgMqHiMsHkMuHmMwHoMwHqMyHsMwHuMuHwMsHyMqH{MoH}MmH_NkHaNiHcNgHeNeHgNgHiNiHkNkHmNmHoNoHqNqHsNsHuNuHwNwHyNyH{N{H}N}H_O_IaOaIcOcIeOeIgOgIiOiIkOkImOmIoOoIqOqIsOsIuOuIwOwIyOyI{O{I}O}I_P_JaPaJcPcJePeJgPgJiPiJkPkJmPmJoPmJqPlJsPlJuPjJwPjJyPhJ{PhJ}PfJ_QfJaQdJcQdJeQcJgQcJiQaJkQaJmQ_JoQ_JqQ}IuQ{ImQ{IoQ{IqQ{IsQ{IuQ{IwQ{IyQ{I{Q{I}Q{I_R{IaR{IcR{IeR{IgR{IiR{IkR{ImR{IoR{IqR{IsR{IuR{IwR{IyR{I{R{I}R{I_S{IaS{IcS{IeS{IgS{IiS{IkS{ImS{IoS{IqS{IsS{IuS{IwS{IyS{I{S{I}S{I_T{IaT{IcT{IeT{IgT{IiT{IkT{ImT{IoT{IqT{IsT{IuT{IwT{IyT{I{T{I}T{I_U{IaU{IcU{IeU{IgU{IiU{IkU{ImU{IoU{IqU{IsU{IuU{IwU{IyU{I{U{I}U{I_V{IaV{IcV{IeV{IgV{IiV{IkV{ImV{IoV{IqV{IsV{IuV{IwV{IyV{I{V{I}V{I_W{IaW{IcW{IeW{IgW{IiW{IkW{ImW{IoW{IqW{IsW{IuW{IwW{IyW{I{W{I}W{I_X{IaX{IcX{IeX{IgX{IiX{IkX{ImX{IoX{IqX{IsX{IuX{IwX{IyX{I{X{I}X{I_Y{I'
    },
    average_speed: 5.81, // m/s
    max_speed: 18.6, // m/s
    average_heartrate: 158,
    max_heartrate: 189,
    device_name: 'Garmin Edge 830',
    athlete: {
      id: 12345678,
      firstname: 'Jean',
      lastname: 'Dupont'
    }
  },
  {
    id: 'strava-4',
    name: 'Sortie récupération',
    type: 'Ride',
    distance: 25600,
    moving_time: 4200,
    total_elevation_gain: 180,
    start_date: '2025-03-18T16:30:00Z',
    start_latlng: [48.573405, 7.752111],
    end_latlng: [48.573405, 7.752111],
    map: {
      polyline: 'klmiGwhgcAgE{CeEyCcE{CaE{C_E{C}D{C{D{CyD{CwD{CuD{CsD{CqD{CoD{CmD{CkD{CiD{CgD{CeD{CcD{CaD{C_D{C}C{C{C{CyC{CwC{CuC{CsC{CqC{CoC{CmC{CkC{CiC{CgC{CeC{CcC{CaC{C_C{C}B{C{B{CyB{CwB{CuB{CsB{CqB{CoB{CmB{CkB{CiB{CgB{CeB{CcB{CaB{C_B{C}A{C{A{CyA{CwA{CuA{CsA{CqA{CoA{CmA{CkA{CiA{CgA{CeA{CcA{CaA{C_A{C}{C}{C{{C{{Cy{Cy{Cw{Cw{Cu{Cu{Cs{Cs{Cq{Cq{Co{Co{Cm{Cm{Ck{Ck{Ci{Ci{Cg{Cg{Ce{Ce{Cc{Cc{Ca{Ca{C_{C_{C}zC}zC{zC{zCyzCyzCwzCwzCuzCuzCszCszCqzCqzCozCozCmzCmzCkzCkzCizCizCgzCgzCezCezCczCczCazCazC_zC_zC}yCcJxBiIvBgHtBeDrBaBpB_@nBiCrEcCzByBvBwAxB}A|BeB`CgBlCkBpCoBtCsBxCwB|C{B`DnG{BvOsBvPqBpNoB`MkBfLgBrKyAlAuA~AqAlGoAzKkAfDgAfMsCfFyC~ImClKeB`D_B`CaZ~PoTzLkKbG{KbGaH|CuNlGcD`BsFdCwC~AwC~AuC`BsCbBqCdBoCfBmChBkCjBiClBgCnB'
    },
    average_speed: 6.1, // m/s
    max_speed: 11.2, // m/s
    average_heartrate: 132,
    max_heartrate: 145,
    device_name: 'Garmin Edge 830',
    athlete: {
      id: 12345678,
      firstname: 'Jean',
      lastname: 'Dupont'
    }
  },
  {
    id: 'strava-5',
    name: 'Sortie groupe club',
    type: 'Ride',
    distance: 85400,
    moving_time: 10800,
    total_elevation_gain: 950,
    start_date: '2025-03-16T08:00:00Z',
    start_latlng: [48.573405, 7.752111],
    end_latlng: [48.573405, 7.752111],
    map: {
      polyline: 'klmiGwhgcA~GsHzHiI|HaIb@g@~I{JzAcBvL}MlOkPjS}TzUmW~VaY`YgZz\\q]lG_HhHaIvJiKlPmQjLuM`OoPrQcSpUyVnXkZb\\}]`_@c`@la@ya@`[i\\xUwVfReStUyV~WwYvYc[tVgXt]o_@r`@gb@ra@kc@j`@yb@h[i^rVmZpWo\\jXk^fXq_@~WcaA~l@{m@~b@wZ|\\}WlaA{z@xvA{qAv}@{t@~pAchAzS}Q`LwKxJ_LjIoKzFgI`UcZfJgJhImH`JyHbNuLpZmVjOgLdH_FvGgDlIeDpKaCx_@{FlSmCxDoAjHyDnNkJrNiKrG}DnK{F`UyJrIoDvA_AjDuExD{EbCuDxJiH~EuCrJuFhSeGxJ_Dlf@eSrBgAjCiBfBmAtGyEjPoLtQqMvP}KrHuDXKnL{DjLgDrKoDrJkE~IgFzIcG|RaOtTsQhGaFzIgGpImKtVgWxWoThSyMbwAcj@pgA}a@vaBqr@hP_Jv|@_d@|JmHvCiC|G}GrCeC|DmClGyD~IyEx`@kNnr@ePpSqDzKcBfL_BdKiAxKaAnLw@dNe@lMOpKEjN@hGCvMgAzLeBpKsBhLyC|cAyZny@aVxJgCdBe@rPaG~]gPtn@sc@v|@gz@'
    },
    average_speed: 7.91, // m/s
    max_speed: 16.5, // m/s
    average_heartrate: 156,
    max_heartrate: 178,
    device_name: 'Garmin Edge 830',
    athlete: {
      id: 12345678,
      firstname: 'Jean',
      lastname: 'Dupont'
    }
  }
];

export default mockStravaActivities;
