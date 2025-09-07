import { useMemo, useState } from 'react';
import type { BabyProfile, Diaper, Feeding, Growth, Sleep } from '../types';
import { claimAchievement, computeAchievements, loadClaims, type AchievementStatus } from '../achievements';

export default function Achievements({
  baby,
  feedings,
  diapers,
  sleeps,
  growth,
}:{
  baby: BabyProfile | null;
  feedings: Feeding[];
  diapers: Diaper[];
  sleeps: Sleep[];
  growth: Growth[];
}){
  const [version, setVersion] = useState(0);
  const statuses = useMemo<AchievementStatus[]>(() => computeAchievements({ baby, feedings, diapers, sleeps, growth }), [baby, feedings, diapers, sleeps, growth, version]);

  const unlocked = statuses.filter(s => s.unlocked).sort((a, b) => (a.claimed === b.claimed ? 0 : a.claimed ? 1 : -1));
  const locked = statuses.filter(s => !s.unlocked);

  function onClaim(id: any){
    claimAchievement(id);
    setVersion(v => v + 1);
  }

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Unlocked</h3>
        {unlocked.length === 0 ? (
          <div className="text-sm text-gray-500">No achievements yet — check the Objectives below for ideas.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlocked.map(({ def, claimed, progressLabel }) => (
              <div key={def.id} className={`p-3 rounded-lg border shadow-sm ${claimed ? 'bg-white border-gray-200' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex items-center gap-2">
                  <div className="text-xl" aria-hidden>{def.icon}</div>
                  <div className="font-medium">{def.title}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{def.description}</div>
                <div className="text-xs text-gray-500 mt-1">Reward: {def.reward}</div>
                <div className="mt-2">
                  {claimed ? (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">Claimed</span>
                  ) : (
                    <button className="text-xs px-2 py-1 rounded bg-indigo-600 text-white" onClick={()=>onClaim(def.id)}>Claim reward</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Objectives</h3>
        {locked.length === 0 ? (
          <div className="text-sm text-gray-500">You’ve completed all current objectives — amazing!</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked
              .slice()
              .sort((a, b) => {
                const ra = a.goal ? (a.progress || 0) / a.goal : 0;
                const rb = b.goal ? (b.progress || 0) / b.goal : 0;
                return rb - ra;
              })
              .map(({ def, progressLabel }) => (
              <div key={def.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <div className="text-xl opacity-60" aria-hidden>{def.icon}</div>
                  <div className="font-medium">{def.title}</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{def.description}</div>
                {progressLabel && <div className="text-xs text-gray-500 mt-1">{progressLabel}</div>}
                <div className="mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">Locked</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

