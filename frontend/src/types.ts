export interface TestSummary {
  test_id: string;
  student_count: number;
  marks_available: number;
}

export interface AggregateSummary {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
}

export interface HistogramBin {
  lower_pct: number;
  upper_pct: number;
  count: number;
}

export interface HistogramData {
  bins: HistogramBin[];
  total: number;
}
