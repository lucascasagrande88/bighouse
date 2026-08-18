// Datos de ejemplo (placeholder). El profesor puede editar todo desde el panel.
// Se cargan una sola vez; después vive en el navegador (localStorage).
window.SEED = {
  gym: { nombre: "BIG HOUSE", tag: "Training Club", ig: "@tugimnasio", wa: "5491100000000", sucursal: "Av. Siempreviva 742 · Buenos Aires" },
  profeCode: "COACH",
  alumnos: [
    {
      id: "a1", nombre: "Martín Gómez", codigo: "MARTIN", nivel: "Intermedio",
      objetivo: "Hipertrofia", notas: "Cuida el hombro derecho. Progresar carga cada 2 semanas.",
      plan: [
        { nombre: "Día 1 — Empuje", ejercicios: [
          { exId:"Barbell_Bench_Press_-_Medium_Grip", series:4, reps:"8-10", peso:"60 kg", descanso:"90s", nota:"Serie top al fallo técnico" },
          { exId:"Barbell_Incline_Bench_Press_-_Medium_Grip", series:3, reps:"10", peso:"40 kg", descanso:"90s", nota:"" },
          { exId:"Dumbbell_Shoulder_Press", series:3, reps:"10-12", peso:"16 kg", descanso:"75s", nota:"" },
          { exId:"Side_Lateral_Raise", series:4, reps:"15", peso:"8 kg", descanso:"45s", nota:"Sin impulso" },
          { exId:"Triceps_Pushdown", series:3, reps:"12", peso:"25 kg", descanso:"60s", nota:"" },
        ]},
        { nombre: "Día 2 — Tirón", ejercicios: [
          { exId:"Pullups", series:4, reps:"Máx", peso:"Corporal", descanso:"90s", nota:"Sumar lastre si pasás 12" },
          { exId:"Bent_Over_Barbell_Row", series:4, reps:"8-10", peso:"50 kg", descanso:"90s", nota:"" },
          { exId:"Seated_Cable_Rows", series:3, reps:"12", peso:"45 kg", descanso:"75s", nota:"" },
          { exId:"Barbell_Curl", series:3, reps:"10", peso:"25 kg", descanso:"60s", nota:"" },
          { exId:"Hammer_Curls", series:3, reps:"12", peso:"12 kg", descanso:"60s", nota:"" },
        ]},
        { nombre: "Día 3 — Piernas", ejercicios: [
          { exId:"Barbell_Squat", series:4, reps:"8", peso:"80 kg", descanso:"120s", nota:"Profundidad paralelo" },
          { exId:"Leg_Press", series:3, reps:"12", peso:"140 kg", descanso:"90s", nota:"" },
          { exId:"Romanian_Deadlift", series:3, reps:"10", peso:"60 kg", descanso:"90s", nota:"Sentí el femoral" },
          { exId:"Leg_Extensions", series:3, reps:"15", peso:"40 kg", descanso:"60s", nota:"" },
          { exId:"Standing_Calf_Raises", series:4, reps:"15-20", peso:"50 kg", descanso:"45s", nota:"" },
        ]},
      ],
    },
    {
      id: "a2", nombre: "Lucía Fernández", codigo: "LUCIA", nivel: "Principiante",
      objetivo: "Tonificar y fuerza general", notas: "Primer mes. Enfocar técnica antes que carga.",
      plan: [
        { nombre: "Día A — Full Body", ejercicios: [
          { exId:"Bodyweight_Squat", series:3, reps:"12", peso:"Corporal", descanso:"60s", nota:"Peso en los talones" },
          { exId:"Incline_Dumbbell_Press", series:3, reps:"10", peso:"8 kg", descanso:"60s", nota:"" },
          { exId:"Wide-Grip_Lat_Pulldown", series:3, reps:"12", peso:"25 kg", descanso:"60s", nota:"" },
          { exId:"Plank", series:3, reps:"30s", peso:"Corporal", descanso:"45s", nota:"Core firme" },
        ]},
        { nombre: "Día B — Full Body", ejercicios: [
          { exId:"Leg_Press", series:3, reps:"12", peso:"50 kg", descanso:"60s", nota:"" },
          { exId:"Dumbbell_Shoulder_Press", series:3, reps:"10", peso:"6 kg", descanso:"60s", nota:"" },
          { exId:"Seated_Cable_Rows", series:3, reps:"12", peso:"25 kg", descanso:"60s", nota:"" },
          { exId:"Barbell_Glute_Bridge", series:3, reps:"12", peso:"20 kg", descanso:"60s", nota:"Apretá arriba" },
          { exId:"3_4_Sit-Up", series:3, reps:"15", peso:"Corporal", descanso:"45s", nota:"" },
        ]},
      ],
    },
    {
      id: "a3", nombre: "Diego Ramírez", codigo: "DIEGO", nivel: "Avanzado",
      objetivo: "Fuerza máxima", notas: "Bloque de fuerza. Cargas altas, bajas repeticiones.",
      plan: [
        { nombre: "Torso", ejercicios: [
          { exId:"Barbell_Bench_Press_-_Medium_Grip", series:5, reps:"5", peso:"90 kg", descanso:"180s", nota:"RPE 8" },
          { exId:"Barbell_Shoulder_Press", series:4, reps:"6", peso:"50 kg", descanso:"150s", nota:"" },
          { exId:"Close-Grip_Barbell_Bench_Press", series:3, reps:"8", peso:"60 kg", descanso:"120s", nota:"" },
          { exId:"Dips_-_Triceps_Version", series:3, reps:"10", peso:"Corporal +10 kg", descanso:"90s", nota:"" },
        ]},
        { nombre: "Pierna", ejercicios: [
          { exId:"Barbell_Full_Squat", series:5, reps:"5", peso:"120 kg", descanso:"180s", nota:"Cinturón desde la 3ª serie" },
          { exId:"Stiff-Legged_Dumbbell_Deadlift", series:4, reps:"8", peso:"40 kg", descanso:"120s", nota:"" },
          { exId:"Barbell_Walking_Lunge", series:3, reps:"10 x pierna", peso:"40 kg", descanso:"90s", nota:"" },
          { exId:"Seated_Calf_Raise", series:4, reps:"12", peso:"40 kg", descanso:"60s", nota:"" },
        ]},
      ],
    },
    {
      id: "a4", nombre: "Sofía López", codigo: "SOFI", nivel: "Intermedio",
      objetivo: "Glúteos y piernas", notas: "Prioridad tren inferior. 4 estímulos semanales.",
      plan: [
        { nombre: "Glúteo + Femoral", ejercicios: [
          { exId:"Barbell_Hip_Thrust", series:4, reps:"12", peso:"50 kg", descanso:"90s", nota:"Pausa 1s arriba" },
          { exId:"Romanian_Deadlift", series:4, reps:"10", peso:"40 kg", descanso:"90s", nota:"" },
          { exId:"Lying_Leg_Curls", series:3, reps:"12", peso:"30 kg", descanso:"60s", nota:"" },
          { exId:"One-Legged_Cable_Kickback", series:3, reps:"15 x lado", peso:"10 kg", descanso:"45s", nota:"" },
        ]},
        { nombre: "Cuádriceps + Core", ejercicios: [
          { exId:"Barbell_Squat", series:4, reps:"10", peso:"50 kg", descanso:"90s", nota:"" },
          { exId:"Leg_Press", series:3, reps:"15", peso:"100 kg", descanso:"75s", nota:"Pies bajos" },
          { exId:"Leg_Extensions", series:3, reps:"15", peso:"35 kg", descanso:"60s", nota:"" },
          { exId:"Cable_Crunch", series:3, reps:"15", peso:"30 kg", descanso:"45s", nota:"" },
        ]},
      ],
    },
  ],
};
