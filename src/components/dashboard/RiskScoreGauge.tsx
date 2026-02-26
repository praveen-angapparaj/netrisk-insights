const getRiskColor = (score: number) => {
  if (score >= 70) return "text-critical";
  if (score >= 50) return "text-risk-high";
  if (score >= 30) return "text-warning";
  return "text-success";
};

const getRiskBg = (score: number) => {
  if (score >= 70) return "bg-critical";
  if (score >= 50) return "bg-risk-high";
  if (score >= 30) return "bg-warning";
  return "bg-success";
};

const getRiskTrack = (score: number) => {
  if (score >= 70) return "bg-critical/15";
  if (score >= 50) return "bg-risk-high/15";
  if (score >= 30) return "bg-warning/15";
  return "bg-success/15";
};

const RiskScoreGauge = ({ score }: { score: number }) => {
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <div className="flex items-center gap-3">
      <div className={`relative h-2 flex-1 rounded-full ${getRiskTrack(clampedScore)}`}>
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getRiskBg(clampedScore)}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      <span className={`text-xs font-bold font-mono ${getRiskColor(clampedScore)}`}>
        {clampedScore.toFixed(0)}
      </span>
    </div>
  );
};

export default RiskScoreGauge;
