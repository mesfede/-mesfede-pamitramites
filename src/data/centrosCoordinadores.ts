import { CentroCoordinador } from '../types';

export const INITIAL_CENTROS_COORDINADORES: Omit<CentroCoordinador, 'id'>[] = [
  {
    hospital: "HTAL. SAN ROQUE",
    trabajador: "Fernanda Galeano",
    telefono: "221 605-9898"
  },
  {
    hospital: "HTAL. SAN ROQUE",
    trabajador: "Fernando Pelais",
    telefono: "221 564-2949"
  },
  {
    hospital: "HTAL. SAN MARTIN",
    trabajador: "Marisa Marron",
    telefono: "221 481-7159"
  },
  {
    hospital: "Hospital Rossi",
    trabajador: "Lorena Landucci",
    telefono: "221 567-7900"
  },
  {
    hospital: "Instituto Medico platense",
    trabajador: "Adrian Rodriguez",
    telefono: "221 455-5554"
  },
  {
    hospital: "Instituto Del Diagnostico",
    trabajador: "Santiago Bonini",
    telefono: "221 597-0262"
  }
];
