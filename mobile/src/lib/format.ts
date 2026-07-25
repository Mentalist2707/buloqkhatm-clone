const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "Hozir";
  if (mins < 60) return `${mins} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days < 7) return `${days} kun oldin`;
  return formatDate(d);
}

export const JUZ_NAMES: Record<number, string> = {
  1:"Alif, Lam, Mim",2:"Sayaqul",3:"Tilkar-Rusul",4:"Lan Tanalu",5:"Val-Muhsonatu",
  6:"La Yuhibbulloh",7:"Va Iza Sami'u",8:"Va Lav Annana",9:"Qolal-Mala'u",10:"Va'lamu",
  11:"Ya'tazirun",12:"Va Ma Min Dabbah",13:"Va Ma Ubarri'u",14:"Rubama",15:"Subhanallazi",
  16:"Qola Alam",17:"Iqtaraba",18:"Qod Aflaha",19:"Va Qolallazina",20:"Amman Xalaqo",
  21:"Utlu Ma Uhiya",22:"Va May Yaqnut",23:"Va Maliya",24:"Faman Azlamu",25:"Ilayhi Yuraddu",
  26:"Ha, Mim",27:"Qola Fama",28:"Qod Sami'allohu",29:"Tabarokallazi",30:"Amma Yatasa'alun",
};
