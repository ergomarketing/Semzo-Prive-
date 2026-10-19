/**
 * Plazo entre el aviso previo de cargo SEPA y el cargo real.
 *
 * El correo "Aviso previo de cargo" le dice a la socia hasta cuando puede avisar antes de que se cobre, y el
 * cron de cargos (execute-sepa-charges) no cobra hasta que ese plazo ha pasado. La norma SEPA pide, por defecto,
 * 14 dias naturales de preaviso salvo que el mandato pacte otro menor; mientras no se confirme con la gestora,
 * se usa 14. Cambiarlo aqui cambia a la vez lo que dice el correo y cuando se cobra.
 */
export const SEPA_PRENOTICE_DAYS = 14
