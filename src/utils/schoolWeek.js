import { getState } from '../state/appState.js';

export function parseEstimatedWeek(value){
  if (!value) return null;
  const nums = String(value).match(/\d+/g);
  if (!nums || !nums.length) return null;
  const week = Number(nums[0]);
  return Number.isFinite(week) ? week : null;
}

export function getCurrentSchoolWeek(){
  const state = getState();
  const raw = state.currentSchoolTermStartDate;
  const start = new Date(raw);
  if (Number.isNaN(start.getTime())) return 1;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  if (!Number.isFinite(week) || week < 1) return 1;
  return week;
}

export function getCurrentYearWeek(date = new Date()){
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return { week, year: target.getUTCFullYear() };
}
