"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Today", score: 30 },
  { month: "Wk 1",  score: 42 },
  { month: "Wk 2",  score: 57 },
  { month: "Wk 3",  score: 68 },
  { month: "Mo 1",  score: 74 },
  { month: "Mo 2",  score: 83 },
  { month: "Mo 3",  score: 93 },
];

export function CognitiveChart() {
  return (
    <div style={{
      width: "100%", borderRadius: 28, padding: "22px 22px 14px",
      background: "var(--color-bg-card)", boxShadow: "var(--shadow-card)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>
            Cognitive Potential
          </p>
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)" }}>
            Your projected progress
          </p>
        </div>
        <div style={{
          padding: "5px 14px", borderRadius: 99,
          background: "var(--color-primary-tint)",
          border: "1px solid var(--color-primary)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>+184%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={148}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
          <defs>
            <linearGradient id="cgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4A7FA5" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#4A7FA5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month"
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            axisLine={false} tickLine={false} domain={[20, 100]} />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12, color: "var(--color-text)",
              fontSize: 13, padding: "8px 14px",
              boxShadow: "var(--shadow-card)",
            }}
            formatter={(value) => [`${value}%`, "Performance"]}
          />
          <Area
            type="monotone" dataKey="score"
            stroke="var(--color-primary)" strokeWidth={2.5}
            fill="url(#cgGrad)"
            dot={{ fill: "var(--color-primary)", r: 3.5, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "var(--color-primary-mid)", filter: "drop-shadow(0 0 5px rgba(74,127,165,0.5))" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", marginTop: 8 }}>
        * Based on average results from users with a similar profile
      </p>
    </div>
  );
}
