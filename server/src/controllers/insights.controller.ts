import { Request, Response } from 'express';
import { InventoryItem } from '../models/InventoryItem';
import { MaintenanceRecord } from '../models/MaintenanceRecord';

function calcRiskScore(item: any, maintenanceCount: number): number {
  let score = 0;
  // Warranty risk (30%)
  if (item.warrantyDate) {
    const days = (new Date(item.warrantyDate).getTime() - Date.now()) / 86400000;
    if (days < 0) score += 30;
    else if (days < 30) score += 25;
    else if (days < 60) score += 18;
    else if (days < 90) score += 10;
  } else { score += 15; }
  // Maintenance risk (25%)
  if (maintenanceCount >= 4) score += 25;
  else if (maintenanceCount >= 3) score += 18;
  else if (maintenanceCount >= 2) score += 10;
  // Criticality (20%)
  if (item.criticality === 'critical') score += 20;
  else if (item.criticality === 'high') score += 14;
  else if (item.criticality === 'medium') score += 7;
  // Lifecycle (15%)
  if (item.purchaseDate) {
    const years = (Date.now() - new Date(item.purchaseDate).getTime()) / (365.25 * 86400000);
    if (years > 5) score += 15;
    else if (years > 4) score += 12;
    else if (years > 3) score += 8;
    else if (years > 2) score += 4;
  }
  // Status (10%)
  if (item.status === 'maintenance') score += 10;
  else if (item.status === 'inactive') score += 7;
  return Math.min(score, 100);
}

function getLevel(score: number): string {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export const getRiskSummary = async (_req: Request, res: Response) => {
  const items = await InventoryItem.find({ status: { $ne: 'decommissioned' } }).populate('site', 'name');
  const maintenanceCounts = await MaintenanceRecord.aggregate([{ $group: { _id: '$asset', count: { $sum: 1 } } }]);
  const mcMap: Record<string, number> = {};
  maintenanceCounts.forEach((m: any) => { mcMap[m._id.toString()] = m.count; });

  const scored = items.map(item => {
    const mc = mcMap[item._id.toString()] || 0;
    const riskScore = calcRiskScore(item, mc);
    return { _id: item._id, name: (item as any).name, assetId: (item as any).assetId, vendor: (item as any).vendor, model: (item as any).model, criticality: (item as any).criticality, status: (item as any).status, site: item.site, riskScore, riskLevel: getLevel(riskScore), maintenanceCount: mc, warrantyDate: (item as any).warrantyDate };
  });

  scored.sort((a, b) => b.riskScore - a.riskScore);

  const avgScore = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b.riskScore, 0) / scored.length) : 0;
  const distribution = { critical: scored.filter(s => s.riskLevel === 'critical').length, high: scored.filter(s => s.riskLevel === 'high').length, medium: scored.filter(s => s.riskLevel === 'medium').length, low: scored.filter(s => s.riskLevel === 'low').length };

  res.json({ avgScore, healthScore: 100 - avgScore, distribution, topRisks: scored.slice(0, 10), total: scored.length });
};

export const getRecommendations = async (_req: Request, res: Response) => {
  const now = new Date();
  const d30 = new Date(Date.now() + 30 * 86400000);
  const d60 = new Date(Date.now() + 60 * 86400000);
  const d90 = new Date(Date.now() + 90 * 86400000);
  const recommendations: Array<{ severity: string; title: string; description: string; count: number }> = [];

  // 1. Warranty expiring < 30 days
  const w30 = await InventoryItem.countDocuments({ warrantyDate: { $gte: now, $lte: d30 } });
  if (w30 > 0) recommendations.push({ severity: 'critical', title: 'Acil Garanti Uzatma', description: `${w30} cihazin garantisi 30 gun icinde sona erecek. Acil garanti uzatma veya yenileme planlamasi yapilmalidir.`, count: w30 });

  // 2. Warranty expiring 30-90 days
  const w90 = await InventoryItem.countDocuments({ warrantyDate: { $gt: d30, $lte: d90 } });
  if (w90 > 0) recommendations.push({ severity: 'high', title: 'Garanti Planlama', description: `${w90} cihazin garantisi 90 gun icinde dolacak. Toplu garanti uzatma pazarligi yapilmasi onerilir.`, count: w90 });

  // 3. Expired warranty
  const expired = await InventoryItem.countDocuments({ warrantyDate: { $lt: now, $ne: null } });
  if (expired > 0) recommendations.push({ severity: 'high', title: 'Suresi Dolmus Garanti', description: `${expired} cihazin garantisi dolmus durumda. Bu cihazlar icin risk degerlendirmesi yapilmalidir.`, count: expired });

  // 4. Overdue maintenance
  const overdue = await MaintenanceRecord.countDocuments({ status: 'scheduled', scheduledDate: { $lt: now } });
  if (overdue > 0) recommendations.push({ severity: 'critical', title: 'Geciken Bakim', description: `${overdue} bakim kaydi planlanan tarihi gecmis durumda. Bakim takvimini guncelleyin.`, count: overdue });

  // 5. High maintenance frequency
  const freqMaint = await MaintenanceRecord.aggregate([{ $group: { _id: '$asset', count: { $sum: 1 } } }, { $match: { count: { $gte: 3 } } }]);
  if (freqMaint.length > 0) recommendations.push({ severity: 'medium', title: 'Sik Ariza', description: `${freqMaint.length} cihaz 3 veya daha fazla bakim kaydi icerir. Bu cihazlarin yenilenmesi degerlendirilmelidir.`, count: freqMaint.length });

  // 6. Critical assets without warranty
  const critNoWarranty = await InventoryItem.countDocuments({ criticality: 'critical', $or: [{ warrantyDate: null }, { warrantyDate: { $lt: now } }] });
  if (critNoWarranty > 0) recommendations.push({ severity: 'critical', title: 'Kritik Cihaz Garantisiz', description: `${critNoWarranty} kritik oneme sahip cihazin aktif garantisi bulunmuyor. Oncelikli olarak garanti kapsamina alinmalidir.`, count: critNoWarranty });

  // 7. Inactive devices
  const inactive = await InventoryItem.countDocuments({ status: 'inactive' });
  if (inactive > 0) recommendations.push({ severity: 'low', title: 'Pasif Cihazlar', description: `${inactive} cihaz pasif durumda. Bu cihazlarin iade edilmesi veya yeniden atanmasi onerilir.`, count: inactive });

  // 8. Unassigned devices
  const unassigned = await InventoryItem.countDocuments({ assignedTo: null, status: 'active' });
  if (unassigned > 0) recommendations.push({ severity: 'low', title: 'Atanmamis Cihazlar', description: `${unassigned} aktif cihaz herhangi bir kullaniciya atanmamis. Zimmet kaydi olusturulmalidir.`, count: unassigned });

  // 9. Maintenance cost analysis
  const totalCost = await MaintenanceRecord.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$cost' } } }]);
  if ((totalCost[0]?.total || 0) > 10000) recommendations.push({ severity: 'medium', title: 'Bakim Maliyeti Yuksek', description: `Toplam bakim maliyeti ${totalCost[0].total.toLocaleString()} TL. Maliyet optimizasyonu icin tedarikci degerlendirmesi yapilmalidir.`, count: 1 });

  // 10. Devices in maintenance too long
  const longMaint = await InventoryItem.countDocuments({ status: 'maintenance' });
  if (longMaint > 5) recommendations.push({ severity: 'medium', title: 'Bakimda Bekleme', description: `${longMaint} cihaz bakim surecinde. Bakim surelerinin kisaltilmasi icin surec iyilestirmesi onerilir.`, count: longMaint });

  recommendations.sort((a, b) => { const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }; return order[a.severity] - order[b.severity]; });
  res.json(recommendations);
};
