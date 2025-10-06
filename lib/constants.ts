export const FEATURE_GROUPS = {
  "Detection & Scoring": [
    ["koi_score", "Detection Score [0-1]", 0.0, 1.0, 0.5],
    ["koi_model_snr", "Transit SNR", 0.0, 50.0, 15.0],
    ["habitability_index", "Habitability Index", 0.0, 1.0, 0.3],
  ],
  "Planet Characteristics": [
    ["planet_density_proxy", "Planet Density (proxy) [g/cm³]", 0.0, 10.0, 1.3],
    ["koi_prad", "Planet Radius [Earth radii]", 0.5, 20.0, 2.0],
    ["koi_prad_err1", "Planet Radius Error (+) [Earth radii]", 0.0, 5.0, 0.5],
  ],
  "False Positive Flags": [
    ["koi_fpflag_nt", "FP Flag (Non-Transit) [0/1]", 0, 1, 0],
    ["koi_fpflag_ss", "FP Flag (Stellar Variability) [0/1]", 0, 1, 0],
    ["koi_fpflag_co", "FP Flag (Contamination) [0/1]", 0, 1, 0],
  ],
  "Transit Parameters": [
    ["koi_duration_err1", "Transit Error (+) [hours]", 0.0, 5.0, 0.1],
    ["duration_period_ratio", "Duration/Period Ratio", 0.0, 0.1, 0.01],
    ["koi_time0bk_err1", "Transit Epoch Error (+) [days]", 0.0, 1.0, 0.01],
    ["koi_period", "Orbital Period [days]", 0.5, 500.0, 10.5],
    ["koi_depth", "Transit Depth [ppm]", 0.0, 10000.0, 500.0],
  ],
  "Orbital Parameters": [
    ["koi_impact", "Impact Parameter", 0.0, 1.0, 0.5],
    ["koi_period_err1", "Orbital Period Error (+) [days]", 0.0, 1.0, 0.01],
  ],
  "Stellar Parameters": [
    ["koi_steff_err1", "Stellar Temp Error (-) [K]", 0.0, 500.0, 50.0],
    ["koi_steff_err2", "Stellar Temp Error (+) [K]", 0.0, 500.0, 50.0],
    ["koi_slogg_err2", "log(g) Error (-) [log(cm/s^2)]", 0.0, 1.0, 0.1],
    ["koi_insol", "Insolation Flux [Earth flux]", 0.0, 10000.0, 1.0],
  ],
} as const

export const CLASS_MAPPING = {
  0: "Faux Positif",
  1: "Candidat",
  2: "Exoplanète",
} as const
