import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { InventoryItem } from '../models/InventoryItem';
import { Project } from '../models/Project';
import { Site } from '../models/Site';
import { AppError } from '../utils/AppError';
import * as XLSX from 'xlsx';

const router = Router();

router.use(authenticate);

/**
 * GET /api/projects/:projectId/sites/:siteId/items/export
 * Export inventory items as .xlsx file
 */
router.get('/:projectId/sites/:siteId/items/export', async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, owner: req.userId });
    if (!project) throw AppError.notFound('Proje bulunamadı');

    const site = await Site.findOne({ _id: req.params.siteId, project: project._id });
    if (!site) throw AppError.notFound('Site bulunamadı');

    const items = await InventoryItem.find({ site: site._id })
      .populate('addedBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    const rows = items.map((item: any, index: number) => ({
      '#': index + 1,
      'Cihaz Adı': item.name,
      'IP Adresi': item.ipAddress || '',
      'Seri No': item.serialNumber || '',
      'Vendor': item.vendor || '',
      'Model': item.model || '',
      'CPU': item.cpu || '',
      'RAM': item.ram || '',
      'Storage': item.storage || '',
      'OS': item.os || '',
      'Rack': item.rack || '',
      'Kabinet': item.cabinet || '',
      'Rack Pozisyon': item.rackPosition || 0,
      'Durum': item.status || '',
      'Garanti Tarihi': item.warrantyDate ? new Date(item.warrantyDate).toLocaleDateString('tr-TR') : '',
      'Notlar': item.notes || '',
      'Ekleyen': item.addedBy?.fullName || '',
      'Oluşturma Tarihi': new Date(item.createdAt).toLocaleDateString('tr-TR'),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 4 }, { wch: 20 }, { wch: 16 }, { wch: 18 },
      { wch: 12 }, { wch: 25 }, { wch: 22 }, { wch: 8 },
      { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 25 },
      { wch: 15 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${site.code} Envanter`);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `${project.name.replace(/\s+/g, '_')}_${site.code}_envanter_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: 'Excel export sırasında hata oluştu' });
  }
});

export default router;
